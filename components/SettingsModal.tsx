
import React, { useState, useEffect } from 'react';
import * as settingsService from '../services/settingsService';
import CloseIcon from './icons/CloseIcon';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [signature, setSignature] = useState('');
    const [defaultCc, setDefaultCc] = useState('');
    const [defaultBcc, setDefaultBcc] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const settings = settingsService.getSettings();
            setSignature(settings.signature);
            setDefaultCc(settings.defaultCc);
            setDefaultBcc(settings.defaultBcc);
            setIsSaved(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        settingsService.saveSettings({ signature, defaultCc, defaultBcc });
        setIsSaved(true);
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    return (
        <div 
            className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl flex justify-center items-center z-[150] p-4 animate-fade-in" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-slate-900/50 rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/5 ring-1 ring-white/10" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-slate-900/80 rounded-t-[40px]">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Email Workspace Settings</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Configure your official transmission defaults</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg active:scale-90"
                        aria-label="Close"
                    ><CloseIcon className="w-6 h-6" /></button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                    <div className="space-y-3">
                        <label htmlFor="email-signature" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Email Signature</label>
                        <textarea
                            id="email-signature"
                            value={signature}
                            onChange={e => setSignature(e.target.value)}
                            className="mt-1 block w-full p-4 bg-slate-950 border border-slate-800 rounded-[28px] shadow-inner h-40 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm leading-relaxed"
                            placeholder="Your Name&#10;Your Title&#10;Your Department"
                        />
                        <p className="text-[10px] text-slate-600 font-bold italic">Auto-appended to all generated formal transmissions.</p>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-white/5">
                        <div className="space-y-3">
                            <label htmlFor="default-cc" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto-CC Recipients</label>
                            <input
                                id="default-cc"
                                type="text"
                                value={defaultCc}
                                onChange={e => setDefaultCc(e.target.value)}
                                className="mt-1 block w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                                placeholder="registrar@diu.edu.bd, assistant@diu.edu.bd"
                            />
                        </div>
                        <div className="space-y-3">
                            <label htmlFor="default-bcc" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto-BCC (Confidential)</label>
                            <input
                                id="default-bcc"
                                type="text"
                                value={defaultBcc}
                                onChange={e => setDefaultBcc(e.target.value)}
                                className="mt-1 block w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                                placeholder="archives@diu.edu.bd"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="px-8 py-6 bg-slate-950/50 border-t border-white/5 flex justify-end items-center gap-4 sticky bottom-0 rounded-b-[40px]">
                    {isSaved && <span className="text-emerald-400 text-xs font-black uppercase tracking-widest animate-pulse">Configuration Applied!</span>}
                    <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-all text-xs uppercase tracking-widest">Dismiss</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 active:scale-95 transition-all text-xs uppercase tracking-widest">Apply Changes</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
