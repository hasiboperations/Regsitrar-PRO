
import React, { useState } from 'react';
import HomeIcon from './icons/HomeIcon';
import DownloadIcon from './icons/DownloadIcon';
import { generateGeneralNoticeDocx, GeneralNoticeData } from '../services/docxService';
import { enhanceNoticeText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import type { Page } from '../App';

const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);
    
    const day = correctedDate.getDate();
    const month = correctedDate.toLocaleString('en-US', { month: 'long' });
    const year = correctedDate.getFullYear();

    // Format: Month Day, Year
    return `${month} ${day}, ${year}`;
};

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </>
    );
};

const GeneralNoticeGeneratorPage: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [date, setDate] = useState(formatDateForInput(new Date()));
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleStartOver = () => {
        setDate(formatDateForInput(new Date()));
        setDescription('');
        setError(null);
    };

    const validateInputs = () => {
        if (!date || !description.trim()) {
            setError('Please fill in both the date and the notice description.');
            return false;
        }
        setError(null);
        return true;
    };

    const handleDownloadDocx = () => {
        if (!validateInputs()) return;
        const noticeData: GeneralNoticeData = {
            date: formatDateForDisplay(date),
            description,
        };
        generateGeneralNoticeDocx(noticeData);
    };

    const handleGenerateWithAI = async () => {
        if (!description.trim()) {
            setError('Please enter some text in the description to generate.');
            return;
        }
        setError(null);
        setIsGenerating(true);

        try {
            const enhancedText = await enhanceNoticeText(description);
            setDescription(enhancedText);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred during AI generation.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-200">
            <div className="shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white font-medium mb-1 text-sm transition-colors group">
                        <span className="p-1.5 rounded-full bg-slate-900 group-hover:bg-indigo-600 transition-colors mr-2 border border-white/5"><HomeIcon className="w-3 h-3" /></span>
                        Back to Home
                    </button>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center mt-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Notice Generator</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Create and download official notices in .docx format.</p>
                </div>
            </div>
            <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 h-full">
                    {/* Left Panel: Inputs */}
                    <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl border border-white/5 flex flex-col">
                        <div className="space-y-6 flex-grow flex flex-col">
                            <h3 className="text-lg font-bold text-white flex items-center"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs mr-3">1</span> Notice Details</h3>
                            <div>
                                <label htmlFor="date" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Date</label>
                                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all" />
                            </div>
                            <div className="flex-grow flex flex-col">
                                <label htmlFor="description" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Notice Description</label>
                                <textarea 
                                    id="description" 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    className="w-full flex-grow p-4 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none shadow-inner placeholder-slate-600 min-h-[200px]" 
                                    placeholder="Enter the main content of the notice here..." 
                                />
                            </div>
                        </div>
                        <div className="mt-auto pt-6 space-y-3">
                             {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium" role="alert">{error}</div>}
                             <div className="flex items-center gap-3">
                                <button onClick={handleStartOver} className="w-full px-4 py-3 bg-slate-800 text-slate-400 font-bold rounded-full hover:bg-slate-700 hover:text-white transition-colors text-sm border border-slate-700">
                                    Clear Form
                                </button>
                                <button 
                                    onClick={handleGenerateWithAI} 
                                    disabled={isGenerating || !description.trim()}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold rounded-full shadow-lg shadow-indigo-500/20 hover:shadow-cyan-500/30 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isGenerating 
                                        ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        : <SparklesIcon className="w-4 h-4 mr-2" />
                                    }
                                    {isGenerating ? 'Generating...' : 'Enhance with AI'}
                                </button>
                             </div>
                        </div>
                    </div>
                    {/* Right Panel: Preview & Download */}
                     <div id="notice-preview" className="bg-slate-950 p-6 rounded-3xl border border-white/5 flex flex-col text-center relative overflow-hidden shadow-2xl min-h-[500px] lg:min-h-0">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.1] pointer-events-none"></div>
                        
                        <h3 className="text-lg font-bold text-white mb-6 relative z-10">2. Preview & Download</h3>
                        <div className="flex-grow w-full bg-white rounded-xl shadow-inner p-8 overflow-y-auto relative z-10 custom-scrollbar" style={{ fontFamily: '"Times New Roman", serif' }}>
                            <div className="text-left text-black">
                                {/* Header */}
                                <p className="text-center font-bold" style={{ fontSize: '20pt' }}>Daffodil International University (DIU)</p>
                                <p className="text-center" style={{ fontSize: '12pt', marginBottom: '1rem' }}>Daffodil Smart City (DSC), Birulia, Savar, Dhaka-1216, Bangladesh</p>
                                
                                {/* Date */}
                                <p className="text-right" style={{ fontSize: '16pt', marginBottom: '1rem' }}>Date: {date ? formatDateForDisplay(date) : '[Date]'}</p>

                                {/* Title */}
                                <p className="text-center underline font-bold" style={{ fontSize: '34pt', margin: '1.5rem 0' }}>Notice</p>
                                
                                {/* Description */}
                                <p className="text-justify" style={{ fontSize: '18pt', lineHeight: 1.5, marginBottom: '2rem' }}>
                                    {description ? <MarkdownRenderer text={description} /> : <span className="text-black">[Your notice description will appear here...]</span>}
                                </p>
                                
                                {/* Signature */}
                                <div style={{ marginTop: '4rem', fontSize: '14pt', textAlign: 'center' }}>
                                    <p>……………………………………………………</p>
                                    <p className="font-bold">Dr. Mohammed Nadir Bin Ali</p>
                                    <p>Registrar</p>
                                    <p>Daffodil International University</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 shrink-0 relative z-10">
                            <button
                                onClick={handleDownloadDocx}
                                className="w-full flex items-center justify-center px-6 py-4 bg-teal-600 text-white font-bold rounded-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:bg-teal-500 transition-all transform hover:-translate-y-0.5 hover:scale-[1.02]"
                            >
                                <DownloadIcon className="w-5 h-5 mr-2" />
                                Download .docx
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralNoticeGeneratorPage;
