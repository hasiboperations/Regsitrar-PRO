import React, { useState, useEffect, useCallback } from 'react';
import HomeIcon from './icons/HomeIcon';
import SparklesIcon from './icons/SparklesIcon';
import DownloadIcon from './icons/DownloadIcon';
import { generateProceedingsDocx, ProceedingsData, getProceedingsBlob } from '../services/docxService';
import type { Page } from '../App';
import EmailComposer from './EmailComposer';
import MailStackIcon from './icons/MailStackIcon';
import { 
    enhanceEmailSubject, 
    enhanceEmailBody, 
    enhanceMemoDescription, 
    generateDetailedDescription, 
    generateMeetingDecision,
    diuCleanText
} from '../services/geminiService';
import MagicWandIcon from './icons/MagicWandIcon';
import TrashIcon from './icons/TrashIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import DragHandleIcon from './icons/DragVerticalIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ArrowPathIcon from './icons/RestoreIcon';
import ForwardIcon from './icons/ArrowRightIcon';
import CloseIcon from './icons/CloseIcon';
import UserIcon from './icons/UserIcon';
import PencilSquareIcon from './icons/PencilSquareIcon';
import TargetIcon from './icons/TargetIcon';
import ClockIcon from './icons/ClockIcon';

interface ProceedingsItem {
  id: string;
  sl: string;
  agenda: string;
  presenter: string;
  discussion: string;
  decision: string;
  responsibility: string;
  isExpanded?: boolean;
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
    "Office of the Honorable Vice Chancellor",
    "Office of the Registrar",
    "Office of the Honorable Pro-Vice Chancellor",
    "Office of the Honorable BoT",
    "Office of the Honorable Treasurer",
    "Office of the Honorable Dean, Academic Affairs"
];

const formatDateForDoc = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
        const date = new Date(isoDate);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date.getTime() + userTimezoneOffset);
        const day = correctedDate.getDate();
        const month = correctedDate.toLocaleString('en-US', { month: 'long' });
        const year = correctedDate.getFullYear();
        return `${month} ${day}, ${year}`;
    } catch (e) { return isoDate; }
};

const formatTimeForDoc = (time: string): string => {
    if (!time) return '';
    try {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) { return time; }
};

const ProceedingsGeneratorPage: React.FC<{ onBack: () => void; title: string; description: string; onNavigate: (page: Page) => void; }> = ({ onBack, title, description, onNavigate }) => {
    const [universityName, setUniversityName] = useState('Daffodil International University');
    const [meetingNameSelection, setMeetingNameSelection] = useState("");
    const [meetingName, setMeetingName] = useState("");
    const [meetingNumber, setMeetingNumber] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
    const [venueSelection, setVenueSelection] = useState("");
    const [venue, setVenue] = useState('');
    
    const [lastMeetingName, setLastMeetingName] = useState('');
    const [lastMeetingDate, setLastMeetingDate] = useState('');
    
    const [chairpersonName, setChairpersonName] = useState('Professor Dr. M. R. Kabir');
    const [chairpersonTitle, setChairpersonTitle] = useState('Vice Chancellor and President');
    const [registrarName, setRegistrarName] = useState('Dr. Mohammed Nadir Bin Ali');
    const [registrarTitle, setRegistrarTitle] = useState('Registrar and Member Secretary');

    const [agendaText, setAgendaText] = useState('');
    const [items, setItems] = useState<ProceedingsItem[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [showEmailComposer, setShowEmailComposer] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState<string | null>(null);

    const isAdvancedMeeting = meetingName.toLowerCase().includes('academic council') || meetingName.toLowerCase().includes('syndicate');

    const startVoiceInput = useCallback((index: number, field: 'discussion' | 'decision' | 'presenter' | 'responsibility') => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setItems(prev => {
                const newItems = [...prev];
                const currentText = newItems[index][field];
                newItems[index] = { ...newItems[index], [field]: diuCleanText(currentText ? `${currentText} ${transcript}` : transcript, true) };
                return newItems;
            });
        };
        recognition.start();
    }, []);

    useEffect(() => {
        const savedData = localStorage.getItem('latestAgendaData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.date) setDate(data.date);
                if (data.time) setTime(data.time);
                if (data.meetingTitle) {
                    setMeetingNameSelection(MEETING_OPTIONS.includes(data.meetingTitle) ? data.meetingTitle : 'custom');
                    setMeetingName(data.meetingTitle);
                }
                setMeetingNumber(data.meetingNumber || '');
                if (data.venue) {
                    setVenueSelection(VENUE_OPTIONS.includes(data.venue) ? data.venue : 'custom');
                    setVenue(data.venue);
                }
                const agendaItems = data.items || [];
                setAgendaText(agendaItems.map((item: any) => `${item.sl}. ${item.agenda}`).join('\n'));
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (!agendaText.trim()) {
            setItems([]);
            return;
        }

        const lines = agendaText.split('\n');
        const newParsedItems: ProceedingsItem[] = [];
        const mainTriggerRegex = /^\s*(\d+|Miscellaneous|Misc)\b/i;

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const match = trimmedLine.match(mainTriggerRegex);
            if (match) {
                const label = match[1];
                const content = diuCleanText(trimmedLine.substring(trimmedLine.indexOf(label) + label.length).replace(/^\s*[\.)]?\s*/, ''), false);
                
                newParsedItems.push({
                    id: `item-${Date.now()}-${newParsedItems.length}`,
                    sl: label,
                    agenda: content,
                    presenter: '',
                    discussion: '',
                    decision: '',
                    responsibility: '',
                    isExpanded: false
                });
            } else if (newParsedItems.length > 0) {
                const lastItem = newParsedItems[newParsedItems.length - 1];
                lastItem.agenda = diuCleanText(lastItem.agenda + ' ' + trimmedLine, false);
            } else {
                newParsedItems.push({
                    id: `item-${Date.now()}-${newParsedItems.length}`,
                    sl: '?',
                    agenda: diuCleanText(trimmedLine, false),
                    presenter: '',
                    discussion: '',
                    decision: '',
                    responsibility: '',
                    isExpanded: false
                });
            }
        });

        setItems(prev => {
            return newParsedItems.map(newItem => {
                const existing = prev.find(p => p.sl === newItem.sl && p.agenda.substring(0, 40) === newItem.agenda.substring(0, 40));
                if (existing) {
                    return { 
                        ...newItem, 
                        id: existing.id,
                        presenter: existing.presenter, 
                        discussion: existing.discussion, 
                        decision: existing.decision,
                        responsibility: existing.responsibility
                    };
                }
                return newItem;
            });
        });
    }, [agendaText]);

    const handleItemUpdate = (index: number, field: keyof ProceedingsItem, value: any) => {
        setItems(prev => {
            const next = [...prev];
            const processedValue = typeof value === 'string' ? diuCleanText(value, true) : value;
            next[index] = { ...next[index], [field]: processedValue };
            return next;
        });
    };

    const handleGenerateDescription = async (index: number) => {
        const item = items[index];
        if (!item.presenter) {
            alert("Please enter a presenter name and designation first.");
            return;
        }
        setIsGeneratingAI(`desc-${index}`);
        try {
            const desc = await generateDetailedDescription({
                presenterName: item.presenter,
                subject: item.agenda,
                meetingType: meetingName,
                context: item.discussion 
            });
            handleItemUpdate(index, 'discussion', desc);
        } catch (e) { console.error(e); } finally { setIsGeneratingAI(null); }
    };

    const handleOpening = (index: number) => {
        const formattedDate = formatDateForDoc(lastMeetingDate);
        const text = `The ${chairpersonName}, ${chairpersonTitle}, delivered the opening address and welcomed all members and guests to the meeting. He then introduced the new members of the ${meetingName}, who became members after the ${lastMeetingName || '[Last Meeting Name]'} meeting of the ${meetingName}, held on ${formattedDate || '[Last Meeting Date]'}. He also welcomed the special guests invited to attend the meeting and acknowledged their guidance and contributions toward the development of the University. The new members are as follows:

On Special Invitations:
1. Chairman, Board of Trustees (BoT), **Dr. Md. Sabur Khan**.
2. Vice Chairman, Board of Trustees (BoT), **Ms. Shahana Khan**.
3. Member, Board of Trustees (BoT), **Ms. Samiha Khan**.
4. Member (General), Board of Trustees (BoT), **Aqib Arafat Khan**.
5. Treasurer, **Dr. Hamidul Haque Khan**.
6. Controller of Examinations, **Mr. Mominul Haque Majumder**.
7. Director, International Affairs Division, **Professor Dr. Md. Fokhray Hossain**.
8. Director, External Affairs, **Professor Dr. Syed Mizanur Rahman**.
9. Librarian, **Dr. Md. Milan Khan**.
10. Director, Division of Research, **Dr. Mahfuza Parveen**.
11. Director, Career Development Center (CDC) and Advisor, Office of Student Affairs, **Mr. Manjurul Haque Khan**.
12. Director, Honors Program, **Ms. Tahsina Yasmin**.`;
        handleItemUpdate(index, 'discussion', text);
    };

    const handleOutline = (index: number) => {
        const text = `The ${chairpersonName}, ${chairpersonTitle}, briefly presented the activities of the University with the help of a PowerPoint presentation (Appendix– ), covering the following areas:
i) Student Development.
ii) International Activities.
iii) Conferences, Seminars, Workshops, Training, etc.
iv) Awards and Achievements.
v) Events.
vi) Others.`;
        handleItemUpdate(index, 'discussion', text);
    };

    const handleConfirmation = (index: number) => {
        const formattedDate = formatDateForDoc(lastMeetingDate);
        const text = `The Registrar presented the proceedings and implementation status of the decisions taken in the ${lastMeetingName || '[Last Meeting Name]'} meeting of the ${meetingName}, held on ${formattedDate || '[Last Meeting Date]'}.`;
        handleItemUpdate(index, 'discussion', text);
    };

    const handleQuickDecision = async (index: number, type: 'Approved' | 'Recommended' | 'Forwarded' | 'Rejected' | 'Opened' | 'Outlined' | 'Confirmed') => {
        setIsGeneratingAI(`dec-${index}`);
        try {
            let dec = "";
            const formattedDate = formatDateForDoc(lastMeetingDate);
            
            if (type === 'Opened') {
                dec = `The ${meetingName} congratulated the new members and welcomed the special guests for attending the meeting.`;
            } else if (type === 'Outlined') {
                dec = `The ${meetingName} acknowledged the presented activities and congratulated DIU for its remarkable awards and achievements.`;
            } else if (type === 'Confirmed') {
                dec = `The ${meetingName} unanimously confirmed the proceedings and acknowledged the implementation status of the decisions of the ${lastMeetingName || '[Last Meeting Name]'}, held on ${formattedDate || '[Last Meeting Date]'}.`;
            } else {
                dec = await generateMeetingDecision({
                    meetingType: meetingName,
                    subject: items[index].agenda,
                    decisionType: type as any,
                    agendaNo: items[index].sl
                });
            }
            handleItemUpdate(index, 'decision', dec);
        } catch (e) { console.error(e); } finally { setIsGeneratingAI(null); }
    };

    const handlePolish = async (index: number, field: 'discussion' | 'decision' | 'responsibility') => {
        const text = items[index][field];
        if (typeof text !== 'string' || !text) return;
        setIsGeneratingAI(`polish-${field}-${index}`);
        try {
            const polished = await enhanceMemoDescription(text);
            handleItemUpdate(index, field, polished);
        } catch (e) { console.error(e); } finally { setIsGeneratingAI(null); }
    };

    const handleDragStart = (index: number) => setDraggedIndex(index);
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        const newItems = [...items];
        const draggedItem = newItems[draggedIndex];
        newItems.splice(draggedIndex, 1);
        newItems.splice(index, 0, draggedItem);
        setItems(newItems);
        setDraggedIndex(index);
    };

    const validate = () => {
        if (!meetingName || !meetingNumber || !date || !venue) {
            setError('Meeting Details are required.');
            return false;
        }
        if (items.length === 0) {
            setError('Agenda items are required.');
            return false;
        }
        setError(null);
        return true;
    };

    const handleDownloadDocx = () => {
        if (!validate()) return;
        const data: ProceedingsData = {
            universityName, meetingName, meetingNumber,
            date: formatDateForDoc(date), time: formatTimeForDoc(time),
            venue, chairpersonName, chairpersonTitle, registrarName,
            registrarTitle,
            items: items.map(i => ({
                sl: i.sl, agenda: i.agenda,
                discussion: diuCleanText(i.discussion, false),
                decision: diuCleanText(i.decision, false),
                responsibility: diuCleanText(i.responsibility, false)
            }))
        };
        generateProceedingsDocx(data);
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-900 selection:text-cyan-100">
            {showEmailComposer && (
                <EmailComposer 
                    document={{
                        doc_id: 'proceedings', doc_type: 'memo', ref: meetingNumber,
                        doc_date: formatDateForDoc(date), from: registrarName,
                        to: 'Committee Members', subject: `Proceedings: ${meetingNumber} ${meetingName}`,
                        body: `Salam and Greetings,\n\nPlease find the proceedings of the ${meetingNumber} ${meetingName} attached for your records.`, cc: []
                    }}
                    onClose={() => setShowEmailComposer(false)}
                    getBlob={async () => await getProceedingsBlob({
                         universityName, meetingName, meetingNumber,
                         date: formatDateForDoc(date), time: formatTimeForDoc(time),
                         venue, chairpersonName, chairpersonTitle, registrarName,
                         registrarTitle,
                         items: items.map(i => ({ sl: i.sl, agenda: i.agenda, discussion: diuCleanText(i.discussion, false), decision: diuCleanText(i.decision, false), responsibility: diuCleanText(i.responsibility, false) }))
                    })}
                    onAiAssist={async (field, text) => {
                        if (field === 'subject') return await enhanceEmailSubject(text);
                        return await enhanceEmailBody(text);
                    }}
                />
            )}

            <div className="shrink-0 bg-slate-900 border-b border-white/5 sticky top-0 z-30 shadow-2xl backdrop-blur-lg bg-slate-900/80">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button onClick={onBack} className="p-2.5 rounded-2xl bg-slate-800 hover:bg-indigo-600 transition-all group shadow-md" title="Back to Home">
                            <HomeIcon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight uppercase">Proceedings <span className="text-cyan-400">Generator</span></h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <button 
                            onClick={handleDownloadDocx} 
                            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-900/40 transition-all hover:scale-105 active:scale-95"
                         >
                            <DownloadIcon className="w-4 h-4" /> Proceedings
                        </button>
                        <button 
                            onClick={() => setShowEmailComposer(true)} 
                            className="px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-2xl text-sm flex items-center gap-2 hover:bg-cyan-700 shadow-lg shadow-cyan-900/40 transition-all hover:scale-105 active:scale-95"
                        >
                            <MailStackIcon className="w-4 h-4" /> Email
                        </button>
                    </div>
                </div>
            </div>

            <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-slate-900/50 p-8 rounded-[32px] shadow-2xl border border-white/5 backdrop-blur-md sticky top-24">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-8 flex items-center">
                            <span className="w-8 h-8 rounded-2xl bg-indigo-500/10 flex items-center justify-center mr-3 text-indigo-400 border border-indigo-500/20">1</span> Meeting Details
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Institution Name</label>
                                <input type="text" value={universityName} onChange={e => setUniversityName(diuCleanText(e.target.value, true))} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Meeting Name</label>
                                <select 
                                    value={meetingNameSelection} 
                                    onChange={e => {
                                        setMeetingNameSelection(e.target.value);
                                        if (e.target.value !== 'custom') setMeetingName(e.target.value);
                                    }}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-white cursor-pointer"
                                >
                                    <option value="" disabled>Select Meeting...</option>
                                    {MEETING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    <option value="custom">Add New Meeting Name…</option>
                                </select>
                                {meetingNameSelection === 'custom' && (
                                    <input type="text" value={meetingName} onChange={e => setMeetingName(diuCleanText(e.target.value, true))} className="w-full mt-3 px-4 py-3 bg-slate-950 border border-indigo-500/50 rounded-2xl text-sm font-bold animate-fade-in text-white" placeholder="Enter custom name" />
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Meeting No</label>
                                <input type="text" value={meetingNumber} onChange={e => setMeetingNumber(diuCleanText(e.target.value, true))} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white" placeholder="e.g. 37th" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Time</label>
                                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white" />
                                </div>
                            </div>

                            {isAdvancedMeeting && (
                                <div className="space-y-4 pt-4 border-t border-white/5 animate-fade-in">
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Advanced References</h4>
                                    <div className="space-y-3">
                                        <input 
                                            type="text" 
                                            value={lastMeetingName} 
                                            onChange={e => setLastMeetingName(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none" 
                                            placeholder="Last Meeting Name (e.g. 53rd)" 
                                        />
                                        <input 
                                            type="date" 
                                            value={lastMeetingDate} 
                                            onChange={e => setLastMeetingDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none" 
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Venue</label>
                                <select 
                                    value={venueSelection} 
                                    onChange={e => {
                                        setVenueSelection(e.target.value);
                                        if (e.target.value !== 'custom') setVenue(e.target.value);
                                    }}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold appearance-none text-white cursor-pointer"
                                >
                                    <option value="" disabled>Select Venue...</option>
                                    {VENUE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    <option value="custom">Add New Venue…</option>
                                </select>
                                {venueSelection === 'custom' && (
                                    <textarea value={venue} onChange={e => setVenue(diuCleanText(e.target.value, true))} className="w-full mt-3 px-4 py-3 bg-slate-950 border border-indigo-500/50 rounded-2xl text-sm font-bold animate-fade-in text-white" placeholder="Enter venue address" rows={2} />
                                )}
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/5 space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chairman Details</h4>
                            <div className="space-y-4">
                                <div className="relative">
                                     <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                     <input type="text" value={chairpersonName} onChange={e => setChairpersonName(diuCleanText(e.target.value, true))} className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs font-black text-indigo-300 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Name" />
                                </div>
                                <div className="relative">
                                    <input 
                                        list="chairman-designations"
                                        type="text" 
                                        value={chairpersonTitle} 
                                        onChange={e => setChairpersonTitle(diuCleanText(e.target.value, true))} 
                                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs font-black text-slate-400 focus:ring-1 focus:ring-indigo-500 outline-none" 
                                        placeholder="Designation" 
                                    />
                                    <datalist id="chairman-designations">
                                        <option value="Vice Chancellor" />
                                        <option value="President" />
                                        <option value="Vice Chancellor and President" />
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-8 border-t border-white/5 space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Secretary</h4>
                            <div className="space-y-4">
                                <div className="relative">
                                     <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                     <input type="text" value={registrarName} onChange={e => setRegistrarName(diuCleanText(e.target.value, true))} className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs font-black text-cyan-300 focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="Name" />
                                </div>
                                <input type="text" value={registrarTitle} onChange={e => setRegistrarTitle(diuCleanText(e.target.value, true))} className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="Designation" />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-8 space-y-10">
                    <section className="bg-slate-900/50 p-8 rounded-[32px] shadow-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center">
                                <span className="w-8 h-8 rounded-2xl bg-cyan-500/10 flex items-center justify-center mr-3 text-cyan-400 border border-cyan-500/20">2</span> Agenda Source
                            </h3>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setAgendaText('')} 
                                    className="p-2 bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl border border-white/5 transition-all"
                                    title="Clear All"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="relative group">
                             <textarea 
                                value={agendaText} 
                                onChange={e => setAgendaText(e.target.value)} 
                                className="w-full h-48 p-6 bg-slate-950 border border-slate-800 rounded-3xl font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-300 placeholder-slate-700 shadow-inner group-hover:border-slate-700" 
                                placeholder="Paste numbered agenda items here..." 
                             />
                            <div className="absolute bottom-4 right-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest pointer-events-none group-focus-within:opacity-0 transition-opacity">
                                Identifies Main Agendas (1, 2, 3...)
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center">
                                <span className="w-8 h-8 rounded-2xl bg-indigo-500/10 flex items-center justify-center mr-3 text-indigo-400 border border-indigo-500/20">3</span> Meeting Workspace
                            </h3>
                        </div>
                        
                        <div className="space-y-6">
                            {items.map((item, index) => (
                                <div 
                                    key={item.id} 
                                    draggable 
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={e => handleDragOver(e, index)}
                                    onDragEnd={() => setDraggedIndex(null)}
                                    className={`bg-slate-900 border rounded-[32px] shadow-2xl overflow-hidden transition-all duration-300 group ${draggedIndex === index ? 'opacity-50 scale-95 border-indigo-500 border-dashed bg-indigo-500/5' : 'border-white/5 hover:border-indigo-500/30'}`}
                                >
                                    {/* Item Header */}
                                    <div className="bg-slate-800/50 p-6 flex items-center gap-6 border-b border-white/5 cursor-default">
                                        <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-indigo-400 transition-colors shrink-0">
                                            <DragHandleIcon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-indigo-900/40">AGENDA: {item.sl}</span>
                                                <button 
                                                    onClick={() => handleItemUpdate(index, 'isExpanded', !item.isExpanded)} 
                                                    className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors bg-slate-900 px-3 py-1 rounded-full border border-white/5"
                                                >
                                                    {item.isExpanded ? "Collapse View" : "Edit Agenda Content"}
                                                </button>
                                            </div>
                                            {item.isExpanded ? (
                                                <textarea
                                                    value={item.agenda}
                                                    onChange={e => handleItemUpdate(index, 'agenda', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                                    rows={2}
                                                />
                                            ) : (
                                                <div 
                                                    className="text-sm font-black text-white truncate cursor-pointer hover:text-cyan-400"
                                                    onClick={() => handleItemUpdate(index, 'isExpanded', true)}
                                                >
                                                    {item.agenda}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => setItems(prev => prev.filter((_, i) => i !== index))} 
                                            className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Agenda Item"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Workspace Body */}
                                    <div className="p-8 space-y-8">
                                        
                                        {/* Discussion / Background Section - Restricted visibility */}
                                        {isAdvancedMeeting && (
                                            <div className="space-y-4 animate-fade-in">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-start md:self-center">Discussion / Background</label>
                                                        
                                                        {/* Opening/Outline/Confirmation Buttons - Responsive */}
                                                        <div className="flex flex-wrap gap-1.5 justify-start md:justify-end w-full md:w-auto">
                                                            <button 
                                                                onClick={() => handleOpening(index)}
                                                                className="px-3 py-2 bg-slate-800 text-slate-300 text-[10px] font-black rounded-xl hover:bg-slate-700 border border-white/5 transition-all shadow-md flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                                                            >
                                                                <PencilSquareIcon className="w-3.5 h-3.5" /> Opening
                                                            </button>
                                                            <button 
                                                                onClick={() => handleOutline(index)}
                                                                className="px-3 py-2 bg-slate-800 text-slate-300 text-[10px] font-black rounded-xl hover:bg-slate-700 border border-white/5 transition-all shadow-md flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                                                            >
                                                                <TargetIcon className="w-3.5 h-3.5" /> Outline
                                                            </button>
                                                            <button 
                                                                onClick={() => handleConfirmation(index)}
                                                                className="px-3 py-2 bg-slate-800 text-slate-300 text-[10px] font-black rounded-xl hover:bg-slate-700 border border-white/5 transition-all shadow-md flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                                                            >
                                                                <CheckCircleIcon className="w-3.5 h-3.5" /> Confirmation
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Presenter Input and Adjacent Action Buttons */}
                                                    <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                                                        <div className="relative flex-grow w-full md:w-auto">
                                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                                <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                value={item.presenter} 
                                                                onChange={e => handleItemUpdate(index, 'presenter', e.target.value)}
                                                                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-700 shadow-inner"
                                                                placeholder="Presenter (Name, Designation)"
                                                            />
                                                        </div>

                                                        {/* Action Buttons: Generate, Voice, Polish - Fully adjacent to Presenter field */}
                                                        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end md:justify-start">
                                                            <button 
                                                                onClick={() => handleGenerateDescription(index)}
                                                                disabled={isGeneratingAI === `desc-${index}`}
                                                                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white text-[10px] font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-900/40 disabled:opacity-50 transition-all active:scale-95 uppercase tracking-widest whitespace-nowrap"
                                                            >
                                                                {isGeneratingAI === `desc-${index}` ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                                                                Generate
                                                            </button>
                                                            <button 
                                                                onClick={() => startVoiceInput(index, 'discussion')} 
                                                                className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-md active:scale-95 border border-white/5"
                                                                title="Voice input"
                                                            >
                                                                <MicrophoneIcon className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handlePolish(index, 'discussion')} 
                                                                className="p-3 bg-cyan-900/30 text-cyan-400 rounded-2xl hover:bg-cyan-600 hover:text-white transition-all border border-cyan-500/20 active:scale-95 shadow-md"
                                                                title="AI Polish"
                                                            >
                                                                <MagicWandIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <textarea 
                                                    value={item.discussion} 
                                                    onChange={e => handleItemUpdate(index, 'discussion', e.target.value)}
                                                    className="w-full h-32 p-6 bg-slate-950 border border-slate-800 rounded-[28px] text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-300 placeholder-slate-800 shadow-inner custom-scrollbar"
                                                    placeholder="Formal background / discussion content..."
                                                />
                                            </div>
                                        )}

                                        {/* Formal Decision Section */}
                                        <div className="space-y-4 pt-8 border-t border-white/5">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-start md:self-center">Formal Decision</label>
                                                
                                                <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end w-full md:w-auto">
                                                    {/* Decisions: Combined AC Helpers and Standard Buttons */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {isAdvancedMeeting && (
                                                            <>
                                                                {(['Opened', 'Outlined', 'Confirmed'] as const).map(type => (
                                                                    <button 
                                                                        key={type} 
                                                                        onClick={() => handleQuickDecision(index, type)}
                                                                        className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 text-[9px] font-black rounded-full border border-cyan-500/20 hover:bg-cyan-500 hover:text-white transition-all shadow-sm uppercase tracking-widest flex items-center gap-1 active:scale-95 whitespace-nowrap"
                                                                    >
                                                                        {type === 'Opened' && <SparklesIcon className="w-2.5 h-2.5" />}
                                                                        {type === 'Outlined' && <TargetIcon className="w-2.5 h-2.5" />}
                                                                        {type === 'Confirmed' && <ClockIcon className="w-2.5 h-2.5" />}
                                                                        {type}
                                                                    </button>
                                                                ))}
                                                                <div className="h-6 w-px bg-white/10 mx-1 self-center"></div>
                                                            </>
                                                        )}
                                                        
                                                        {(['Approved', 'Recommended', 'Forwarded', 'Rejected'] as const).map(type => (
                                                            <button 
                                                                key={type} 
                                                                onClick={() => handleQuickDecision(index, type)}
                                                                className={`px-4 py-2 text-[10px] font-black rounded-full transition-all shadow-md border flex items-center gap-2 uppercase tracking-widest active:scale-95 whitespace-nowrap ${
                                                                    type === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' :
                                                                    type === 'Recommended' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500 hover:text-white' :
                                                                    type === 'Forwarded' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white' :
                                                                    'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white'
                                                                }`}
                                                            >
                                                                {type === 'Approved' && <CheckCircleIcon className="w-3.5 h-3.5" />}
                                                                {type === 'Forwarded' && <ForwardIcon className="w-3.5 h-3.5" />}
                                                                {type === 'Rejected' && <CloseIcon className="w-3.5 h-3.5" />}
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <textarea 
                                                    value={item.decision} 
                                                    onChange={e => handleItemUpdate(index, 'decision', e.target.value)}
                                                    className="flex-grow h-28 p-6 bg-slate-950 border border-slate-800 rounded-[28px] text-sm font-black text-cyan-400 outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner placeholder-slate-900"
                                                    placeholder="Final formal decision text..."
                                                />
                                                <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                                                    <button 
                                                        onClick={() => startVoiceInput(index, 'decision')} 
                                                        className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-md active:scale-95 border border-white/5"
                                                        title="Voice Input"
                                                    >
                                                        <MicrophoneIcon className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handlePolish(index, 'decision')} 
                                                        className="p-3 bg-cyan-900/30 text-cyan-400 rounded-2xl hover:bg-cyan-600 hover:text-white transition-all border border-cyan-500/20 active:scale-95 shadow-md"
                                                        title="AI Rewrite"
                                                    >
                                                        <MagicWandIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Responsibility Box - Hidden for AC/Syndicate */}
                                        {!isAdvancedMeeting && (
                                            <div className="space-y-4 pt-8 border-t border-white/5 animate-fade-in">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsibility</label>
                                                </div>
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    <textarea 
                                                        value={item.responsibility} 
                                                        onChange={e => handleItemUpdate(index, 'responsibility', e.target.value)}
                                                        className="flex-grow h-20 p-6 bg-slate-950 border border-slate-800 rounded-[28px] text-sm font-black text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner placeholder-slate-900"
                                                        placeholder="Name/Department responsible for this action..."
                                                    />
                                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                                                        <button 
                                                            onClick={() => startVoiceInput(index, 'responsibility')} 
                                                            className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-md active:scale-95 border border-white/5"
                                                            title="Voice Input"
                                                        >
                                                            <MicrophoneIcon className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handlePolish(index, 'responsibility')} 
                                                            className="p-3 bg-cyan-900/30 text-cyan-400 rounded-2xl hover:bg-cyan-600 hover:text-white transition-all border border-cyan-500/20 active:scale-95 shadow-md"
                                                            title="Grammar Polish"
                                                        >
                                                            <MagicWandIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-[24px] text-red-400 text-sm font-black animate-fade-in shadow-lg shadow-red-900/10 tracking-wide text-center uppercase">{error}</div>}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProceedingsGeneratorPage;