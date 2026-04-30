import React, { useState, useRef } from 'react';
import HomeIcon from './icons/HomeIcon';
import DownloadIcon from './icons/DownloadIcon';
import { generateAgendaDocx, AgendaData, getAgendaBlob } from '../services/docxService';
import TrashIcon from './icons/TrashIcon';
import DragHandleIcon from './icons/DragVerticalIcon';
import type { Page } from '../App';
import MagicWandIcon from './icons/MagicWandIcon';
import { enhanceAgendaItem, enhanceEmailSubject, enhanceEmailBody } from '../services/geminiService';
import EmailComposer from './EmailComposer';
import MailStackIcon from './icons/MailStackIcon';
import type { DocumentContent } from '../types';

interface AgendaItem {
  id: number;
  sl: string;
  agenda: string;
}

const MEETING_OPTIONS = [
    "Management Committee Meeting",
    "Dean's Committee Meeting",
    "Joint Committee Meeting",
    "Special Committee Meeting",
    "Academic Council Meeting",
    "Syndicate Committee Meeting"
];

const VENUE_OPTIONS = [
    "Office of the Registrar",
    "Office of the Honorable Vice Chancellor",
    "Office of the Honorable Pro-Vice Chancellor",
    "Office of the Honorable BoT",
    "Office of the Honorable Treasurer",
    "Office of the Honorable Dean, Academic Affairs"
];

const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);

    const month = correctedDate.toLocaleDateString('en-US', { month: 'long' });
    const day = correctedDate.getDate(); // Numeric day
    const year = correctedDate.toLocaleDateString('en-US', { year: 'numeric' });

    // Format: Month Day, Year (e.g. December 2, 2025)
    return `${month} ${day}, ${year}`;
};

const formatTimeForDisplay = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

const AgendaGeneratorPage: React.FC<{ onBack: () => void; title: string; description: string; onNavigate: (page: Page) => void; }> = ({ onBack, title, description, onNavigate }) => {
    const [meetingTitle, setMeetingTitle] = useState("");
    const [meetingNameSelection, setMeetingNameSelection] = useState("");
    const [meetingNumber, setMeetingNumber] = useState("");
    
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    
    const [venue, setVenue] = useState('');
    const [venueSelection, setVenueSelection] = useState('');

    const [items, setItems] = useState<AgendaItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // Bulk Import State
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkText, setBulkText] = useState('');

    // Drag and Drop State
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

    // AI Rewrite State
    const [rewritingId, setRewritingId] = useState<number | null>(null);

    // Email State
    const [showEmailComposer, setShowEmailComposer] = useState(false);

    const handleItemChange = (id: number, field: 'sl' | 'agenda', value: string) => {
        setItems(currentItems =>
            currentItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const renumberItems = (currentItems: AgendaItem[]): AgendaItem[] => {
        let numericCount = 1;
        let miscCount = 1;
        let reportCount = 1;

        return currentItems.map(item => {
            const sl = item.sl ? item.sl.toString().trim() : '';
            
            // Check for Numeric (digits only or empty, or digits with dot)
            if (sl === '' || /^\d+\.?$/.test(sl)) {
                return { ...item, sl: String(numericCount++) };
            }
            
            // Check for Misc
            if (/^Misc(?:ellaneous)?/i.test(sl)) {
                return { ...item, sl: `Misc ${miscCount++}` };
            }

            // Check for Report
            if (/^Report/i.test(sl)) {
                return { ...item, sl: `Report ${reportCount++}` };
            }

            // Custom labels remain untouched
            return item;
        });
    };

    const handleAddItem = (type: 'numeric' | 'misc' | 'report' = 'numeric') => {
        let rawSl = '';
        if (type === 'numeric') {
            rawSl = ''; 
        } else if (type === 'misc') {
            rawSl = 'Misc';
        } else if (type === 'report') {
            rawSl = 'Report';
        }

        const newItem = { id: Date.now(), sl: rawSl, agenda: '' };
        setItems(prev => renumberItems([...prev, newItem]));
    };

    const handleRemoveItem = (id: number) => {
        const remainingItems = items.filter(item => item.id !== id);
        setItems(renumberItems(remainingItems));
    };
    
    const handleStartOver = () => {
        setMeetingTitle('');
        setMeetingNameSelection('');
        setMeetingNumber('');
        setDate('');
        setTime('');
        setVenue('');
        setVenueSelection('');
        setItems([]);
        setError(null);
        setBulkText('');
        setIsBulkMode(false);
    };

    const handleProcessBulk = () => {
        if (!bulkText.trim()) return;
        
        let lines: string[] = [];
        if (bulkText.includes('\n')) {
            lines = bulkText.split('\n').filter(l => l.trim());
        } else {
            lines = bulkText.match(/[^.!?]+[.!?]+(?=\s|$)/g)?.map(l => l.trim()) || [bulkText.trim()];
        }

        const newItems: AgendaItem[] = [];
        const regex = /^\s*((?:Misc(?:ellaneous)?(?:[\w.-]*)?|Report(?:[\w.-]*)?|Other(?:[\w.-]*)?|\d+[\w.-]*))\s*[\.)]?\s+(.*)$/i;

        lines.forEach((line, index) => {
            const match = line.trim().match(regex);
            let sl = '';
            let agenda = '';

            if (match) {
                sl = match[1].replace(/\.+$/, '');
                agenda = match[2].trim();
            } else {
                sl = ''; 
                agenda = line.trim();
            }
            
            newItems.push({
                id: Date.now() + index,
                sl,
                agenda
            });
        });

        setItems(prev => renumberItems([...prev, ...newItems]));
        setBulkText('');
        setIsBulkMode(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
        e.preventDefault();
        if (draggedItemId === null || draggedItemId === targetId) return;

        const draggedItemIndex = items.findIndex(item => item.id === draggedItemId);
        const targetItemIndex = items.findIndex(item => item.id === targetId);

        if (draggedItemIndex === -1 || targetItemIndex === -1) return;

        const newItems = [...items];
        const [draggedItem] = newItems.splice(draggedItemIndex, 1);
        newItems.splice(targetItemIndex, 0, draggedItem);

        // Auto-renumber after drop
        setItems(renumberItems(newItems));
        setDraggedItemId(null);
    };

    const handleRewriteItem = async (id: number, currentText: string) => {
        if (!currentText.trim()) return;
        setRewritingId(id);
        try {
            const rewritten = await enhanceAgendaItem(currentText);
            handleItemChange(id, 'agenda', rewritten);
        } catch (error) {
            console.error("Rewrite failed", error);
            // Optionally show error toast
        } finally {
            setRewritingId(null);
        }
    };

    const validateInputs = () => {
        if (!meetingTitle || !date || !venue || !time || items.some(i => !i.sl.trim() || !i.agenda.trim())) {
            setError('Please fill in all fields, including all agenda items.');
            return false;
        }
        setError(null);
        return true;
    };

    const handleDownloadDocx = () => {
        if (!validateInputs()) return;

        const formattedDate = formatDateForDisplay(date);
        const formattedTime = formatTimeForDisplay(time);

        const agendaData: AgendaData = {
            meetingTitle,
            meetingNumber,
            date: formattedDate,
            time: formattedTime,
            venue,
            items: items.map(({ id, ...rest }) => rest),
        };

        generateAgendaDocx(agendaData);
    };

    const handleEmail = () => {
        if (!validateInputs()) return;
        setShowEmailComposer(true);
    };

    // Wrapper to generate the Agenda blob for the EmailComposer
    const getAgendaBlobWrapper = async (): Promise<Blob> => {
        const formattedDate = formatDateForDisplay(date);
        const formattedTime = formatTimeForDisplay(time);

        const agendaData: AgendaData = {
            meetingTitle,
            meetingNumber,
            date: formattedDate,
            time: formattedTime,
            venue,
            items: items.map(({ id, ...rest }) => rest),
        };
        
        return await getAgendaBlob(agendaData);
    };

    const handleContinue = () => {
        if (!validateInputs()) return;

        localStorage.setItem('latestAgendaData', JSON.stringify({
            meetingTitle,
            meetingNumber,
            date,
            time,
            venue,
            items: items.map(({ id, ...rest }) => rest),
        }));

        onNavigate('proceedings_generator');
    };
    
    // Construct a dummy document object for the EmailComposer metadata
    const dummyDocForEmail: DocumentContent = {
        doc_id: 'agenda-current',
        doc_type: 'memo', // Placeholder type
        ref: meetingNumber || 'N/A',
        doc_date: formatDateForDisplay(date),
        from: 'Registrar',
        to: 'Committee Members',
        subject: `Scheduled Meeting: ${meetingNumber} ${meetingTitle} at ${formatTimeForDisplay(time)}`,
        body: `Honorable Sir/Madam,
Salam and Greetings!

I would like to inform you that the schedule for the ${meetingNumber} of the ${meetingTitle} has been scheduled as follows:

Meeting Name: ${meetingTitle}
Meeting Number: ${meetingNumber}
Date        : ${formatDateForDisplay(date)}
Time        : ${formatTimeForDisplay(time)}
Venue       : ${venue}

Please check the email attachment.

Sincerely,
[Your Name]
[Your Designation]`,
        cc: []
    };

    const handleEmailAiAssist = async (field: 'subject' | 'message', text: string) => {
        if (field === 'subject') return await enhanceEmailSubject(text);
        if (field === 'message') return await enhanceEmailBody(text);
        return text;
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-200">
            {showEmailComposer && (
                <EmailComposer 
                    document={dummyDocForEmail} 
                    onClose={() => setShowEmailComposer(false)} 
                    getBlob={getAgendaBlobWrapper}
                    onAiAssist={handleEmailAiAssist}
                />
            )}

            <div className="shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white font-medium mb-1 text-sm transition-colors group">
                        <span className="p-1.5 rounded-full bg-slate-900 group-hover:bg-indigo-600 transition-colors mr-2 border border-white/5"><HomeIcon className="w-3 h-3" /></span>
                        Back to Home
                    </button>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center mt-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">{title}</span>
                    </h1>
                     <p className="text-slate-400 mt-1">{description}</p>
                </div>
            </div>
            <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 h-full">
                    {/* Left Panel: Inputs */}
                    <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl border border-white/5 flex flex-col">
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs mr-3">1</span> Meeting Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Meeting Name</label>
                                    <select 
                                        value={meetingNameSelection} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setMeetingNameSelection(val);
                                            if (val === 'custom') {
                                                setMeetingTitle('');
                                            } else {
                                                setMeetingTitle(val);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="" disabled>Select Meeting Name...</option>
                                        {MEETING_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="custom">Add New Meeting Name…</option>
                                    </select>
                                    {meetingNameSelection === 'custom' && (
                                        <input 
                                            type="text" 
                                            value={meetingTitle} 
                                            onChange={e => setMeetingTitle(e.target.value)} 
                                            className="w-full mt-3 px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-600 animate-fade-in" 
                                            placeholder="Enter custom meeting name..." 
                                            autoFocus
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Meeting Number</label>
                                    <input 
                                        type="text" 
                                        value={meetingNumber} 
                                        onChange={e => setMeetingNumber(e.target.value)} 
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-600" 
                                        placeholder="e.g., 53rd, 124th" 
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Date</label>
                                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label htmlFor="time" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Time</label>
                                    <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="venue" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Venue</label>
                                <select 
                                    value={venueSelection} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setVenueSelection(val);
                                        if (val === 'custom') {
                                            setVenue('');
                                        } else {
                                            setVenue(val);
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all appearance-none"
                                >
                                    <option value="" disabled>Select Venue...</option>
                                    {VENUE_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                    <option value="custom">Add New Venue…</option>
                                </select>
                                {venueSelection === 'custom' && (
                                    <textarea 
                                        id="venue" 
                                        value={venue} 
                                        onChange={e => setVenue(e.target.value)} 
                                        className="w-full mt-3 px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all resize-none placeholder-slate-600 animate-fade-in" 
                                        placeholder="Enter custom venue address..." 
                                        rows={2}
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>

                         <div className="flex-grow flex flex-col mt-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs mr-3">2</span> Agenda Items</h3>
                                <button 
                                    onClick={() => setIsBulkMode(!isBulkMode)}
                                    className={`text-xs px-3 py-1.5 font-bold rounded-lg border transition-colors active:scale-95 ${isBulkMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}
                                >
                                    {isBulkMode ? 'Cancel Paste' : 'Paste Text'}
                                </button>
                            </div>
                            
                            {isBulkMode ? (
                                <div className="animate-fade-in mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                                    <label className="block text-xs font-semibold text-slate-400 mb-2">Paste paragraph or list (will be split automatically):</label>
                                    <textarea
                                        value={bulkText}
                                        onChange={e => setBulkText(e.target.value)}
                                        className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed min-h-[150px] resize-y placeholder-slate-600 font-mono"
                                        placeholder={`1. Confirmation of minutes\n2. Approval of budget\n\nOr paste a paragraph...`}
                                    />
                                    <button 
                                        onClick={handleProcessBulk}
                                        disabled={!bulkText.trim()}
                                        className="mt-3 w-full px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm active:scale-95"
                                    >
                                        Import Items
                                    </button>
                                </div>
                            ) : null}

                            <div className="space-y-3 pr-2 flex-grow overflow-y-auto min-h-[150px] custom-scrollbar">
                                {items.length > 0 ? items.map((item, index) => (
                                     <div 
                                        key={item.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, item.id)}
                                        className={`flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700 animate-fade-in group hover:border-slate-600 transition-colors cursor-move ${draggedItemId === item.id ? 'opacity-50 border-dashed border-indigo-500' : ''}`}
                                     >
                                         <div className="flex flex-col items-center justify-center pt-2 text-slate-600 cursor-grab active:cursor-grabbing p-1">
                                            <DragHandleIcon className="w-5 h-5" />
                                         </div>
                                         <input
                                            type="text"
                                            value={item.sl}
                                            onChange={e => handleItemChange(item.id, 'sl', e.target.value)}
                                            className="w-20 p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-center focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-sm"
                                            placeholder="Sl."
                                        />
                                        <textarea
                                            value={item.agenda}
                                            onChange={e => handleItemChange(item.id, 'agenda', e.target.value)}
                                            className="w-full flex-grow p-2 bg-slate-900 border border-slate-700 text-white rounded-lg shadow-none focus:ring-1 focus:ring-cyan-500 outline-none resize-none text-sm leading-relaxed"
                                            placeholder={`Agenda point...`}
                                            rows={1}
                                            style={{ minHeight: '40px' }}
                                        />
                                        
                                        <div className="flex flex-col gap-1 mt-1">
                                            <button 
                                                onClick={() => handleRemoveItem(item.id)} 
                                                className="p-2 text-red-500 hover:text-red-600 font-bold hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100" 
                                                aria-label="Remove item"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" strokeWidth={2.5}/>
                                            </button>
                                            <button 
                                                onClick={() => handleRewriteItem(item.id, item.agenda)}
                                                disabled={rewritingId === item.id}
                                                className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${rewritingId === item.id ? 'text-white bg-indigo-500/30' : 'text-white font-bold hover:text-cyan-400 hover:bg-slate-700'}`}
                                                aria-label="Rewrite with AI"
                                                title="Re-write Professional Agenda"
                                            >
                                                {rewritingId === item.id ? (
                                                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <MagicWandIcon className="w-4 h-4"/>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    !isBulkMode && (
                                        <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                                            <p className="font-medium">No agenda items yet.</p>
                                            <p className="text-xs mt-1">Add items manually or use "Paste Text" above.</p>
                                        </div>
                                    )
                                )}
                            </div>
                             <div className="grid grid-cols-3 gap-3 mt-4">
                                <button onClick={() => handleAddItem('numeric')} className="px-3 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors text-xs shadow-md active:scale-95">
                                    + Add Item
                                </button>
                                <button onClick={() => handleAddItem('misc')} className="px-3 py-2.5 bg-slate-800 text-amber-200/80 font-bold rounded-xl hover:bg-slate-700 hover:text-amber-200 border border-slate-700 transition-colors text-xs shadow-md active:scale-95">
                                    + Add Misc
                                </button>
                                <button onClick={() => handleAddItem('report')} className="px-3 py-2.5 bg-slate-800 text-teal-200/80 font-bold rounded-xl hover:bg-slate-700 hover:text-teal-200 border border-slate-700 transition-colors text-xs shadow-md active:scale-95">
                                    + Add Report
                                </button>
                             </div>
                        </div>
                        <div className="mt-auto pt-6 space-y-3">
                             {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium" role="alert">{error}</div>}
                             <button onClick={handleStartOver} className="w-full px-4 py-2.5 bg-transparent text-slate-400 font-semibold rounded-full hover:bg-slate-800 hover:text-white transition-colors text-sm active:scale-95">
                                Start Over & Clear Form
                             </button>
                        </div>
                    </div>
                    {/* Right Panel: Preview & Download */}
                     <div id="agenda-preview" className="bg-slate-950 p-6 rounded-3xl border border-white/5 flex flex-col text-center relative overflow-hidden shadow-2xl min-h-[500px] lg:min-h-0">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.1] pointer-events-none"></div>
                        
                        <h3 className="text-lg font-bold text-white mb-6 relative z-10">3. Preview & Download</h3>
                        <div className="flex-grow w-full bg-white rounded-xl shadow-inner p-8 overflow-y-auto relative z-10 custom-scrollbar" style={{ fontFamily: '"Times New Roman", serif', padding: '1in' }}>
                            <div className="text-left text-black" style={{ lineHeight: '1.15', textAlign: 'justify' }}>
                                {/* Header */}
                                <p className="text-center font-bold" style={{ fontSize: '22pt', marginBottom: '6pt' }}>Daffodil International University (DIU)</p>
                                <p className="text-center" style={{ fontSize: '12pt', marginBottom: '12pt' }}>Daffodil Smart City (DSC), Birulia, Savar, Dhaka-1216, Bangladesh</p>
                                
                                {/* Main Heading */}
                                <p className="text-center font-bold" style={{ fontSize: '14pt', margin: '12pt 0', textDecoration: 'underline' }}>Meeting Agenda</p>
                                
                                {/* Details */}
                                <div style={{ fontSize: '12pt' }}>
                                     <div className="grid grid-cols-[130px_auto] gap-1">
                                        <div className="">Meeting Name</div><div>: {meetingTitle || '[Meeting Name]'}</div>
                                        <div className="">Meeting Number</div><div>: {meetingNumber || '[Number]'}</div>
                                        <div>Date</div><div>: {date ? formatDateForDisplay(date) : '[Date]'}</div>
                                        <div>Time</div><div>: {time ? formatTimeForDisplay(time) : '[Time]'}</div>
                                        <div>Venue</div><div>: {venue || '[Venue]'}</div>
                                     </div>
                                </div>

                                {/* Agenda Title */}
                                <p className="font-bold" style={{ fontSize: '12pt', marginTop: '12pt', marginBottom: '6pt' }}>Agenda of the {meetingNumber ? meetingNumber + ' ' : ''}{meetingTitle || '[Meeting Name]'}:</p>
                                
                                {/* Agenda Items */}
                                <div style={{ fontSize: '12pt' }}>
                                    {items.length > 0 ? items.map(item => (
                                        <div key={item.id} style={{ marginBottom: '6pt', display: 'flex', alignItems: 'baseline' }}>
                                            <div style={{ minWidth: '0.8in', flexShrink: 0 }}>
                                                {item.sl.replace(/\.+$/, '')}.
                                            </div>
                                            <div style={{ textAlign: 'justify' }}>
                                                {item.agenda}
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ marginBottom: '6pt', display: 'flex' }}>
                                            <div style={{ minWidth: '0.5in' }}>1.</div>
                                            <div>[Your first agenda item will appear here]</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                         <div className="mt-8 shrink-0 relative z-10">
                             <div className="flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    onClick={handleDownloadDocx}
                                    className="flex-1 flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:bg-teal-500 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
                                >
                                    <DownloadIcon className="w-5 h-5 mr-2" />
                                    Download
                                </button>
                                <button
                                    onClick={handleEmail}
                                    className="flex-1 flex items-center justify-center px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:bg-cyan-500 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
                                >
                                    <MailStackIcon className="w-5 h-5 mr-2" />
                                    Send Email
                                </button>
                                <button
                                    onClick={handleContinue}
                                    className="flex-1 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:bg-indigo-500 transition-all transform hover:-translate-y-0.5 whitespace-nowrap active:scale-95 text-sm"
                                >
                                    Next: Proceedings &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgendaGeneratorPage;