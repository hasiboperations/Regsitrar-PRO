import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { DocumentContent } from '../types';
import { generateSingleDocx, generateAllDocx, parseBodyContent } from '../services/docxService';
import EditIcon from './icons/EditIcon';
import SaveIcon from './icons/SaveIcon';
import WordIcon from './icons/WordIcon';
import MailStackIcon from './icons/MailStackIcon';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';
import SparklesIcon from './icons/SparklesIcon';
import Toast from './Toast';
import GrammarCheckModal from './GrammarCheckModal';

const ParsedBody: React.FC<{ body: string }> = ({ body }) => {
    const parts = parseBodyContent(body);
    return (
        <>
            {parts.map((part, index) => {
                if (part.type === 'paragraph') {
                    return <p key={index} style={{ margin: '12pt 0 0 0', textAlign: 'justify', lineHeight: 1.5 }}>{part.content}</p>;
                }
                if (part.type === 'table') {
                    return (
                        <div key={index} className="my-4">
                            <table className="w-full border-collapse border border-black">
                                <thead>
                                    <tr>{part.headers.map((h, i) => <th key={i} className="border border-black px-2 py-1 bg-gray-50">{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {part.rows.map((r, i) => (
                                        <tr key={i}>{r.map((c, j) => <td key={j} className="border border-black px-2 py-1">{c}</td>)}</tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                return null;
            })}
        </>
    );
};

const EditableField: React.FC<{ value: string; onChange: (v: string) => void; isTextarea?: boolean; isBold?: boolean; align?: 'left' | 'center' }> = ({ value, onChange, isTextarea, isBold, align = 'left' }) => {
    const common = "w-full bg-indigo-50 border-none p-1 rounded focus:ring-1 focus:ring-indigo-400 outline-none transition-all";
    const style: React.CSSProperties = { fontWeight: isBold ? 'bold' : 'normal', textAlign: align, resize: 'vertical' };
    if (isTextarea) return <textarea value={value} onChange={e => onChange(e.target.value)} className={`${common} resize-y`} style={style} rows={4} />;
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} className={common} style={style} />;
};

interface DocumentEditorProps {
    document: DocumentContent;
    allDocs: DocumentContent[];
    onSave: (d: DocumentContent) => void;
    onEmail: () => void;
    onEmailAll: () => void;
    onSelectDoc: (id: string) => void;
    isGrammarCheckOpen?: boolean;
    onToggleGrammarCheck?: (open: boolean) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ document: currentDoc, allDocs, onSave, onEmailAll, onSelectDoc, isGrammarCheckOpen, onToggleGrammarCheck }) => {
    const [editedDoc, setEditedDoc] = useState(currentDoc);
    const [isEditing, setIsEditing] = useState(false);
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditedDoc(currentDoc);
        setIsEditing(false);
        setSearchQuery('');
    }, [currentDoc]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        window.document.addEventListener('mousedown', handleClickOutside);
        return () => window.document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredDocs = useMemo(() => {
        if (!allDocs) return [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return allDocs;
        return allDocs.filter(d => 
            d.subject.toLowerCase().includes(q) || 
            d.doc_id.toLowerCase().includes(q)
        );
    }, [searchQuery, allDocs]);

    const handleSave = () => {
        onSave(editedDoc);
        setIsEditing(false);
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isDropdownOpen) setIsDropdownOpen(true);
            setActiveIndex(prev => (prev < filteredDocs.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && activeIndex < filteredDocs.length) {
                handleSelect(filteredDocs[activeIndex].doc_id);
            }
        } else if (e.key === 'Escape') {
            setIsDropdownOpen(false);
        }
    };

    const handleSelect = (id: string) => {
        onSelectDoc(id);
        setIsDropdownOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
    };

    const handleCcChange = (index: number, val: string) => {
        const newCc = [...editedDoc.cc];
        newCc[index] = val;
        setEditedDoc({ ...editedDoc, cc: newCc });
    };

    const removeCc = (index: number) => {
        const newCc = editedDoc.cc.filter((_, i) => i !== index);
        setEditedDoc({ ...editedDoc, cc: newCc });
    };

    const addCc = () => {
        setEditedDoc({ ...editedDoc, cc: [...editedDoc.cc, ""] });
    };

    const handleApplyGrammarFix = (newText: string) => {
        const updated = { ...editedDoc, body: newText };
        setEditedDoc(updated);
        onSave(updated);
    };

    return (
        <div className="h-full flex flex-col bg-slate-950">
            {showSaveToast && <Toast message="Memorandum updated." />}

            {isGrammarCheckOpen && (
                <GrammarCheckModal
                    isOpen={isGrammarCheckOpen}
                    onClose={() => onToggleGrammarCheck?.(false)}
                    text={editedDoc.body}
                    onApply={handleApplyGrammarFix}
                />
            )}
            
            <div className="px-4 py-3 border-b border-white/10 bg-slate-900/90 backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-0 z-[100]">
                <div className="relative w-full lg:w-[500px]" ref={dropdownRef}>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                            <SearchIcon className="w-4.5 h-4.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input 
                            ref={inputRef}
                            type="text" 
                            role="combobox"
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="listbox"
                            aria-controls="search-results-list"
                            aria-autocomplete="list"
                            value={searchQuery} 
                            onChange={e => { 
                                setSearchQuery(e.target.value); 
                                setIsDropdownOpen(true);
                                setActiveIndex(-1);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-11 pr-12 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder-slate-500 shadow-inner"
                            placeholder="Quick find memorandum..."
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {searchQuery && (
                                <button 
                                    onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                    aria-label="Clear search"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {isDropdownOpen && (
                        <div 
                            id="search-results-list"
                            role="listbox"
                            className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-slate-700 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] max-h-[450px] overflow-y-auto z-[110] p-2 animate-slide-in-up origin-top border-white/5 backdrop-blur-xl bg-slate-900/95"
                        >
                            <div className="px-4 py-2 mb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Search Results ({filteredDocs.length})</span>
                            </div>
                            
                            {filteredDocs.length > 0 ? (
                                filteredDocs.map((d, idx) => (
                                    <button 
                                        key={d.doc_id} 
                                        role="option"
                                        aria-selected={activeIndex === idx || d.doc_id === currentDoc.doc_id}
                                        onClick={() => handleSelect(d.doc_id)} 
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        className={`w-full text-left px-4 py-4 rounded-[20px] transition-all flex flex-col gap-1 group relative ${
                                            d.doc_id === currentDoc.doc_id 
                                            ? 'bg-cyan-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/5' 
                                            : activeIndex === idx 
                                                ? 'bg-slate-800 border-white/5' 
                                                : 'hover:bg-slate-800/40 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">{d.doc_id}</span>
                                            {d.doc_id === currentDoc.doc_id && (
                                                <span className="text-[9px] bg-cyan-500 text-black font-black px-2 py-0.5 rounded-full tracking-tighter">OPEN</span>
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold leading-tight ${d.doc_id === currentDoc.doc_id ? 'text-white' : 'text-slate-300'}`}>
                                            {d.subject}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="py-12 px-6 text-center">
                                    <p className="text-white font-bold mb-1">No memorandums found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end w-full lg:w-auto">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-black transition-all hover:bg-slate-700 uppercase tracking-widest active:scale-95 border border-white/5">Cancel</button>
                            <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-900/40 uppercase tracking-widest"><SaveIcon className="w-4 h-4" /> Save</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onToggleGrammarCheck?.(true)} 
                                className="px-5 py-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:bg-indigo-500 hover:text-white active:scale-95 uppercase tracking-widest border border-indigo-500/20"
                                title="Run AI Grammar Check"
                            >
                                <SparklesIcon className="w-4 h-4" /> Polish
                            </button>
                            <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:bg-slate-700 active:scale-95 uppercase tracking-widest border border-white/5">
                                <EditIcon className="w-4 h-4" /> Edit
                            </button>
                        </div>
                    )}
                    <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>
                    <button onClick={onEmailAll} className="px-5 py-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl text-xs font-black border border-cyan-500/30 flex items-center gap-2 transition-all hover:bg-cyan-500 hover:text-white active:scale-95 uppercase tracking-widest"><MailStackIcon className="w-4 h-4" /> Email All</button>
                    <button onClick={() => generateSingleDocx(isEditing ? editedDoc : currentDoc)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-900/40 uppercase tracking-widest"><WordIcon className="w-4 h-4" /> Export</button>
                    <button onClick={() => generateAllDocx(allDocs)} className="px-5 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-black border border-slate-700 flex items-center gap-2 transition-all hover:bg-slate-700 hover:text-white active:scale-95 uppercase tracking-widest"><WordIcon className="w-4 h-4" /> Batch</button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-0 sm:p-4 custom-scrollbar bg-slate-900/20">
                <div 
                    className="document-preview-container animate-fade-in mx-auto relative overflow-x-hidden bg-white shadow-2xl"
                    style={{
                        width: '100%',
                        maxWidth: '210mm',
                        minHeight: '297mm',
                        padding: '1in',
                        margin: '2rem auto',
                        fontFamily: "'Calibri', sans-serif",
                        fontSize: '12pt',
                        color: 'black',
                    }}
                    role="article"
                    aria-label="Memorandum Document Preview"
                >
                    <div className="text-center">
                        <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: 0 }}>Daffodil International University (DIU)</h1>
                        <p style={{ fontSize: '11pt', margin: 0 }}>Daffodil Smart City (DSC), Birulia, Savar, Dhaka-1216, Bangladesh</p>
                        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', textDecoration: 'underline', margin: '24pt 0' }}>Memorandum</h2>
                    </div>

                    <div style={{ margin: '12pt 0', lineHeight: 1.5 }}>
                        <div className="grid grid-cols-[80px_1fr] items-baseline">
                            <span className="font-bold">Ref</span>
                            <span>: {isEditing ? <EditableField value={editedDoc.ref} onChange={v => setEditedDoc({...editedDoc, ref: v})} /> : currentDoc.ref}</span>
                            
                            <span className="font-bold">Date</span>
                            <span>: {isEditing ? <EditableField value={editedDoc.doc_date} onChange={v => setEditedDoc({...editedDoc, doc_date: v})} /> : currentDoc.doc_date}</span>
                            
                            <span className="font-bold">From</span>
                            <span>: {isEditing ? <EditableField value={editedDoc.from} onChange={v => setEditedDoc({...editedDoc, from: v})} /> : currentDoc.from}</span>
                            
                            <span className="font-bold">To</span>
                            <span>: {isEditing ? <EditableField value={editedDoc.to} onChange={v => setEditedDoc({...editedDoc, to: v})} isTextarea /> : currentDoc.to}</span>
                        </div>
                    </div>

                    <div style={{ margin: '24pt 0' }}>
                        <p style={{ fontWeight: 'bold', textAlign: 'center', lineHeight: 1.5 }}>
                            Subject: {isEditing ? <EditableField value={editedDoc.subject} onChange={v => setEditedDoc({...editedDoc, subject: v})} isBold align="center" isTextarea /> : currentDoc.subject}
                        </p>
                    </div>
                    
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '8pt' }}>Description:</p>
                    {isEditing ? (
                        <div className="bg-indigo-50/30 p-2 rounded-xl border border-indigo-100">
                             <EditableField value={editedDoc.body} onChange={v => setEditedDoc({...editedDoc, body: v})} isTextarea />
                        </div>
                    ) : (
                        <ParsedBody body={currentDoc.body} />
                    )}

                    <div style={{ marginTop: '48pt' }} className="border-t border-slate-100 pt-12">
                        <div className="flex justify-between items-center mb-2">
                             <p style={{ fontWeight: 'bold', margin: 0, textDecoration: 'underline' }}>Cc:</p>
                             {isEditing && (
                                 <button onClick={addCc} className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded font-bold uppercase tracking-tighter">Add Recipient</button>
                             )}
                        </div>
                        <div className="space-y-1">
                            {(isEditing ? editedDoc.cc : currentDoc.cc || []).map((item, i) => (
                                <div key={i} className="flex group items-baseline gap-2">
                                    <span className="text-[11pt] opacity-80 shrink-0">{i + 1}.</span>
                                    {isEditing ? (
                                        <div className="flex-grow flex items-center gap-2">
                                            <EditableField value={item} onChange={v => handleCcChange(i, v)} />
                                            <button onClick={() => removeCc(i)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '11pt', opacity: 0.8 }}>{item}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="absolute bottom-8 left-0 right-0 text-center opacity-10 pointer-events-none">
                        <span className="text-[10pt] font-black uppercase tracking-[0.5em]">AI Registrar Pro Digital Scribe</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentEditor;