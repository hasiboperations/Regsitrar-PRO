
import React, { useState, useEffect } from 'react';
import type { GrammarSegment } from '../services/geminiService';
import { checkGrammar } from '../services/geminiService';
import CloseIcon from './icons/CloseIcon';
import SparklesIcon from './icons/SparklesIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface GrammarCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    onApply: (newText: string) => void;
}

const GrammarCheckModal: React.FC<GrammarCheckModalProps> = ({ isOpen, onClose, text, onApply }) => {
    const [segments, setSegments] = useState<GrammarSegment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && text) {
            setIsLoading(true);
            setError(null);
            checkGrammar(text)
                .then(data => {
                    setSegments(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err.message || 'Failed to check grammar.');
                    setIsLoading(false);
                });
        } else {
            setSegments([]);
        }
    }, [isOpen, text]);

    const handleAcceptSuggestion = (index: number) => {
        setSegments(prev => prev.map((seg, i) => {
            if (i === index && seg.suggestion) {
                return { ...seg, text: seg.suggestion, isError: false };
            }
            return seg;
        }));
        setSelectedSegmentIndex(null);
    };

    const handleAcceptAll = () => {
        setSegments(prev => prev.map(seg => {
            if (seg.isError && seg.suggestion) {
                return { ...seg, text: seg.suggestion, isError: false };
            }
            return seg;
        }));
        setSelectedSegmentIndex(null);
    };

    const handleApplyChanges = () => {
        const fullText = segments.map(s => s.text).join('');
        onApply(fullText);
        onClose();
    };

    if (!isOpen) return null;

    const errorCount = segments.filter(s => s.isError).length;

    return (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl flex justify-center items-center z-[110] p-0 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-900 rounded-[32px] shadow-2xl flex flex-col overflow-hidden w-[95vw] h-[90vh] border border-white/10 ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 hidden sm:block">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Document AI Polisher</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Refining institutional tone & grammar</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all active:scale-90 border border-white/5 shadow-lg">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-950 relative order-1 lg:order-1 custom-scrollbar">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mb-6"></div>
                                <p className="text-white font-black tracking-widest uppercase text-xs animate-pulse">AI Agent Analyzing Context...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-400 p-10 bg-red-500/5 rounded-3xl border border-red-500/20 max-w-md mx-auto my-10 shadow-2xl">
                                <p className="font-black uppercase tracking-widest mb-3">AI Processing Error</p>
                                <p className="text-sm opacity-80 mb-6">{error}</p>
                                <button onClick={() => { setIsLoading(true); checkGrammar(text).then(setSegments).catch(e => setError(e.message)).finally(() => setIsLoading(false)); }} className="px-6 py-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all font-bold text-xs uppercase tracking-widest">Retry Connection</button>
                            </div>
                        ) : (
                            <div className="bg-slate-900 p-10 md:p-14 rounded-[40px] shadow-2xl border border-white/5 min-h-full text-lg leading-relaxed whitespace-pre-wrap font-serif text-slate-200 max-w-5xl mx-auto ring-1 ring-white/5 selection:bg-indigo-500/30 selection:text-white">
                                {segments.map((segment, index) => (
                                    <span
                                        key={index}
                                        onClick={() => segment.isError ? setSelectedSegmentIndex(index) : null}
                                        className={`transition-all duration-300 rounded-md px-1 py-0.5 ${
                                            segment.isError 
                                                ? selectedSegmentIndex === index 
                                                    ? 'bg-indigo-500/40 text-white ring-2 ring-indigo-400 shadow-lg scale-105 inline-block' 
                                                    : 'bg-red-500/20 text-red-100 border-b-2 border-red-500/50 hover:bg-red-500/30 cursor-pointer'
                                                : 'text-slate-200'
                                        }`}
                                    >
                                        {segment.text}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-full lg:w-[450px] h-80 lg:h-auto bg-slate-900 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shrink-0 order-2 lg:order-2 shadow-[-20px_0_40px_rgba(0,0,0,0.4)] relative z-10">
                        <div className="p-6 border-b border-white/5 bg-slate-950/50">
                            <h4 className="font-black text-white flex items-center justify-between text-xs uppercase tracking-widest">
                                AI Observations
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full text-white shadow-lg ${errorCount > 0 ? 'bg-red-600 shadow-red-900/40' : 'bg-emerald-600 shadow-emerald-900/40'}`}>
                                    {errorCount} Issues Detected
                                </span>
                            </h4>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-5 bg-slate-900 custom-scrollbar">
                            {!isLoading && errorCount === 0 && !error && (
                                <div className="text-center py-20 flex flex-col items-center animate-fade-in">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 mb-6 shadow-2xl">
                                        <CheckCircleIcon className="w-10 h-10 text-emerald-400" />
                                    </div>
                                    <p className="font-black text-white uppercase tracking-[0.2em] text-xs">Excellent Draft</p>
                                    <p className="text-xs text-slate-500 mt-2">No structural or linguistic issues found.</p>
                                </div>
                            )}
                            
                            {selectedSegmentIndex !== null && segments[selectedSegmentIndex] && (
                                <div className="bg-slate-950 p-6 rounded-[28px] shadow-2xl border border-indigo-500/30 ring-1 ring-indigo-500/20 animate-slide-in-up">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                            {segments[selectedSegmentIndex].type || 'Refinement'}
                                        </span>
                                        <button onClick={() => setSelectedSegmentIndex(null)} className="text-slate-500 hover:text-white transition-colors">&times;</button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Original Phrase:</p>
                                            <p className="text-slate-400 line-through text-xs bg-red-500/5 p-3 rounded-2xl border border-red-500/10">{segments[selectedSegmentIndex].text}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">AI Suggestion:</p>
                                            <p className="text-emerald-400 font-bold text-sm bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20 shadow-inner">{segments[selectedSegmentIndex].suggestion}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                                {segments[selectedSegmentIndex].explanation}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => handleAcceptSuggestion(selectedSegmentIndex)}
                                            className="w-full py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/40 text-xs uppercase tracking-widest active:scale-95"
                                        >
                                            Apply Refinement
                                        </button>
                                    </div>
                                </div>
                            )}

                            {segments.map((seg, idx) => {
                                if (!seg.isError || idx === selectedSegmentIndex) return null;
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedSegmentIndex(idx)}
                                        className="bg-slate-950 p-4 rounded-2xl border border-white/5 hover:border-indigo-500/30 hover:shadow-xl transition-all cursor-pointer group animate-fade-in"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{seg.type || 'Polishing Note'}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 line-through truncate mb-1.5 group-hover:text-red-400 transition-colors">{seg.text}</p>
                                        <p className="text-emerald-400 font-black text-xs tracking-tight">{seg.suggestion}</p>
                                    </div>
                                );
                            })}
                        </div>
                        {errorCount > 0 && (
                            <div className="p-6 bg-slate-950 border-t border-white/5 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                                <button 
                                    onClick={handleAcceptAll}
                                    className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/40 text-xs uppercase tracking-widest active:scale-95"
                                >
                                    Fix All Issues ({errorCount})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-slate-950 border-t border-white/5 flex justify-end gap-3 shrink-0 order-3">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 transition-all text-xs uppercase tracking-widest">
                        Cancel
                    </button>
                    <button 
                        onClick={handleApplyChanges}
                        className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 transition-all text-xs uppercase tracking-widest active:scale-95"
                    >
                        Apply to Document
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GrammarCheckModal;
