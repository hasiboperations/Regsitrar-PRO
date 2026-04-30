
import React, { useState, useEffect, useRef } from 'react';
import type { Template, DocumentType, CustomPlaceholder } from '../types';
import * as templateService from '../services/templateService';
import type { StoredCustomTemplate } from '../services/templateService';
import * as placeholderService from '../services/placeholderService';
import { PLACEHOLDERS } from '../constants/placeholders';
import { parseBodyContent } from '../services/docxService';
import mammoth from 'mammoth';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import CopyIcon from './icons/CopyIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ClockIcon from './icons/ClockIcon';
import RestoreIcon from './icons/RestoreIcon';
import UndoIcon from './icons/UndoIcon';
import RedoIcon from './icons/RedoIcon';
import ConfirmationDialog from './ConfirmationDialog';
import ChevronDownIcon from './icons/ChevronDownIcon';
// FIX: Added missing import for CloseIcon
import CloseIcon from './icons/CloseIcon';

interface TemplateManagerProps {
    isOpen: boolean;
    onClose: () => void;
    generatorType: DocumentType;
    onUpdate: () => void;
    defaultTemplates: Template[];
}

const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

const TemplateManager: React.FC<TemplateManagerProps> = ({ isOpen, onClose, generatorType, onUpdate, defaultTemplates }) => {
    const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
    const [view, setView] = useState<'list' | 'form' | 'history'>('list');
    const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
    const [currentTemplateHistory, setCurrentTemplateHistory] = useState<StoredCustomTemplate['history']>([]);
    const [templateName, setTemplateName] = useState('');
    const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const importFileRef = useRef<HTMLInputElement>(null);
    
    const [customPlaceholders, setCustomPlaceholders] = useState<CustomPlaceholder[]>([]);
    const [editingPlaceholder, setEditingPlaceholder] = useState<Partial<CustomPlaceholder> | null>(null);
    const [phName, setPhName] = useState('');
    const [phDesc, setPhDesc] = useState('');
    const [phError, setPhError] = useState('');
    
    const [confirmAction, setConfirmAction] = useState<{
        action: () => void;
        title: string;
        message: string;
        confirmText: string;
    } | null>(null);

    const [history, setHistory] = useState<string[]>(['']);
    const [historyPointer, setHistoryPointer] = useState(0);

    const templateContent = history[historyPointer];
    const canUndo = historyPointer > 0;
    const canRedo = historyPointer < history.length - 1;

    const refreshCustomPlaceholders = () => {
        setCustomPlaceholders(placeholderService.getCustomPlaceholders(generatorType));
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const refreshCustomTemplates = () => {
        setCustomTemplates(templateService.getCustomTemplates(generatorType));
    };

    useEffect(() => {
        if (isOpen) {
            refreshCustomTemplates();
            refreshCustomPlaceholders();
            setView('list');
            setCurrentTemplate(null);
            setError(null);
            setToast(null);
        }
    }, [isOpen, generatorType]);
    
    if (!isOpen) return null;

    const handleContentChange = (newContent: string) => {
        setError(null);
        if (newContent === templateContent) return;

        const newHistory = history.slice(0, historyPointer + 1);
        newHistory.push(newContent);
        setHistory(newHistory);
        setHistoryPointer(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (canUndo) setHistoryPointer(prev => prev - 1);
    };

    const handleRedo = () => {
        if (canRedo) setHistoryPointer(prev => prev + 1);
    };

    const handleEdit = (template: Template) => {
        setCurrentTemplate(template);
        setTemplateName(template.name);
        setHistory([template.content]);
        setHistoryPointer(0);
        setActiveTab('editor');
        setView('form');
        setError(null);
    };

    const handleAddNew = () => {
        setCurrentTemplate(null);
        setTemplateName('');
        setHistory(['']);
        setHistoryPointer(0);
        setActiveTab('editor');
        setView('form');
        setError(null);
    };

    const handleDelete = (templateId: string) => {
        setConfirmAction({
            action: () => {
                templateService.deleteCustomTemplate(generatorType, templateId);
                onUpdate();
                refreshCustomTemplates();
                showToast('Template deleted successfully.');
            },
            title: 'Delete Template',
            message: 'Are you sure you want to delete this template? This action cannot be undone.',
            confirmText: 'Delete'
        });
    };
    
    const handleSave = () => {
        if (!templateName.trim() || !templateContent.trim()) {
            setError('Template name and content cannot be empty.');
            return;
        }
        if (currentTemplate) {
            templateService.updateCustomTemplate(generatorType, currentTemplate.id, { name: templateName, content: templateContent });
        } else {
            templateService.addCustomTemplate(generatorType, { name: templateName, content: templateContent });
        }
        onUpdate();
        refreshCustomTemplates();
        setView('list');
        showToast('Template saved successfully!');
    };
    
    const handleShowHistory = () => {
        if (!currentTemplate) return;
        const templateWithHistory = templateService.getTemplateWithHistory(generatorType, currentTemplate.id);
        if (templateWithHistory) {
            setCurrentTemplateHistory(templateWithHistory.history.slice().reverse());
            setView('history');
        }
    };
    
    const handleRestoreVersion = (version: { content: string, savedAt: string }) => {
        if (!currentTemplate) return;
        setConfirmAction({
            action: () => {
                 const restoredTemplate = templateService.restoreTemplateVersion(generatorType, currentTemplate.id, version);
                if (restoredTemplate) {
                    setHistory([restoredTemplate.content]);
                    setHistoryPointer(0);
                    setView('form');
                    showToast('Template version restored.');
                } else {
                    showToast('Failed to restore version.', 'error');
                }
            },
            title: 'Restore Version',
            message: 'Are you sure you want to restore this version?',
            confirmText: 'Restore'
        });
    };
    
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const input = event.target;
        input.value = ''; 
        try {
            const arrayBuffer = await fileToArrayBuffer(file);
            const result = await mammoth.extractRawText({ arrayBuffer });
            const content = result.value;
            if (!content.trim()) {
                showToast("Import failed: Document is empty.", 'error');
                return;
            }
            const defaultName = file.name.replace(/\.docx$/i, '');
            setCurrentTemplate(null);
            setTemplateName(defaultName);
            setHistory([content]);
            setHistoryPointer(0);
            setActiveTab('editor');
            setView('form');
            setError(null);
            showToast(`Content from "${file.name}" imported.`);
        } catch (error) {
            console.error(error);
            showToast('Failed to read Word file.', 'error');
        }
    };

    const handleCopyPlaceholder = (placeholderText: string) => {
        navigator.clipboard.writeText(placeholderText).then(() => {
            setCopiedPlaceholder(placeholderText);
            setTimeout(() => setCopiedPlaceholder(null), 2000);
        });
    };

    const availableDefaultPlaceholders = PLACEHOLDERS[generatorType] || [];

    const handleEditPlaceholder = (p: CustomPlaceholder) => {
        setEditingPlaceholder(p);
        setPhName(p.name);
        setPhDesc(p.description);
        setPhError('');
    };

    const handleAddNewPlaceholder = () => {
        setEditingPlaceholder({});
        setPhName('');
        setPhDesc('');
        setPhError('');
    };

    // FIX: Added missing handleCancelEditPlaceholder function
    const handleCancelEditPlaceholder = () => {
        setEditingPlaceholder(null);
        setPhName('');
        setPhDesc('');
        setPhError('');
    };

    const handleSavePlaceholder = () => {
        const sanitizedName = phName.trim().replace(/[^a-zA-Z0-9_]/g, '');
        if (!sanitizedName) {
            setPhError('Invalid placeholder name.');
            return;
        }
        if (!phDesc.trim()) {
            setPhError('Description is required.');
            return;
        }

        if (editingPlaceholder?.id) {
            placeholderService.updateCustomPlaceholder(generatorType, editingPlaceholder.id, { name: sanitizedName, description: phDesc });
        } else {
            placeholderService.addCustomPlaceholder(generatorType, { name: sanitizedName, description: phDesc });
        }
        refreshCustomPlaceholders();
        setEditingPlaceholder(null);
    };

    const handleDeletePlaceholder = (placeholderId: string) => {
        setConfirmAction({
            action: () => {
                placeholderService.deleteCustomPlaceholder(generatorType, placeholderId);
                refreshCustomPlaceholders();
                showToast('Deleted successfully.');
            },
            title: 'Delete Placeholder',
            message: 'Confirm deletion?',
            confirmText: 'Delete'
        });
    };

    const renderListView = () => (
        <div className="space-y-6">
            <div>
                 <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-bold text-white">Custom Templates</h4>
                    <div className="flex items-center gap-2">
                        <input type="file" ref={importFileRef} onChange={handleImport} accept=".docx" className="hidden" />
                        <button onClick={() => importFileRef.current?.click()} className="text-xs px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors">Import Word</button>
                    </div>
                </div>
                {customTemplates.length > 0 ? (
                    <ul className="space-y-3">
                        {customTemplates.map(template => (
                            <li key={template.id} className="flex justify-between items-center p-4 bg-slate-900 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all shadow-lg shadow-black/20">
                                <span className="font-bold text-slate-200">{template.name}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(template)} className="p-2 rounded-xl text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(template.id)} className="p-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-slate-500 py-10 bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">No custom templates yet.</p>
                )}
                <div className="mt-6">
                    <button onClick={handleAddNew} className="w-full px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 active:scale-95 transition-all">+ Create New Template</button>
                </div>
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">System Templates</h4>
                <ul className="space-y-3 opacity-60">
                    {defaultTemplates.map(template => (<li key={template.id} className="p-3 bg-slate-900 text-slate-400 rounded-xl border border-white/5">{template.name}</li>))}
                </ul>
            </div>
        </div>
    );
    
    const renderHistoryView = () => (
         <div className="animate-fade-in">
            <h4 className="text-lg font-bold text-white mb-4">Version History: {currentTemplate?.name}</h4>
            {currentTemplateHistory.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {currentTemplateHistory.map((version, index) => (
                        <li key={version.savedAt} className="p-4 bg-slate-900 rounded-2xl border border-white/5">
                             <div className="flex justify-between items-center">
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-200">
                                        {new Date(version.savedAt).toLocaleString()}
                                        {index === 0 && <span className="ml-3 text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">CURRENT</span>}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate mt-1">{version.content.substring(0, 100)}...</p>
                                </div>
                                {index > 0 && (
                                     <button onClick={() => handleRestoreVersion(version)} className="shrink-0 flex items-center text-xs font-bold px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all ml-4">
                                        <RestoreIcon className="w-4 h-4 mr-1.5"/> Restore
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-slate-500 py-10 bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">No history found.</p>
            )}
        </div>
    );

    const renderPreview = () => {
        const placeholdersMap = new Map<string, string>();
        availableDefaultPlaceholders.forEach(p => placeholdersMap.set(p.placeholder, p.example));
        customPlaceholders.forEach(p => placeholdersMap.set(`{{${p.name}}}`, `[Sample for ${p.name}]`));
        let previewText = templateContent;
        placeholdersMap.forEach((value, key) => {
            const regex = new RegExp(key.replace(/{{/g, '{{\\s*').replace(/}}/g, '\\s*}}'), 'g');
            previewText = previewText.replace(regex, value);
        });
        previewText = previewText.replace(/{{(.*?)}}/g, '[Sample for $1]');
        const parts = parseBodyContent(previewText);
        return (
            <div className="p-6 bg-white rounded-b-2xl border border-white/10 min-h-[15rem] text-sm text-black shadow-inner overflow-y-auto">
                {parts.map((part, index) => {
                    if (part.type === 'paragraph') return <p key={index} className="mb-3 leading-relaxed">{part.content}</p>;
                    if (part.type === 'table') return <div key={index} className="mb-4 overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 border border-gray-300"><thead><tr>{part.headers.map((h, i) => <th key={i} className="px-3 py-2 text-left text-xs font-bold text-gray-900 uppercase bg-gray-100">{h}</th>)}</tr></thead><tbody className="bg-white divide-y divide-gray-200">{part.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2 text-sm text-gray-700">{c}</td>)}</tr>)}</tbody></table></div>;
                    return null;
                })}
            </div>
        );
    };

    const renderFormView = () => (
        <div className="space-y-6 animate-fade-in">
            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">{error}</div>}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="w-full">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Template Name</label>
                    <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} className="block w-full p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none text-white" placeholder="e.g., Formal Committee Announcement" />
                 </div>
                 {currentTemplate && !currentTemplate.isDefault && (
                    <button onClick={handleShowHistory} className="shrink-0 flex items-center text-xs font-bold px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all shadow-md">
                        <ClockIcon className="w-4 h-4 mr-2"/> History
                    </button>
                 )}
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Template Content</label>
                    <div className="flex items-center gap-2">
                        <button onClick={handleUndo} disabled={!canUndo} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-all"><UndoIcon className="w-5 h-5" /></button>
                        <button onClick={handleRedo} disabled={!canRedo} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-all"><RedoIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="flex border-b border-white/5">
                    <button onClick={() => setActiveTab('editor')} className={`px-6 py-2.5 text-xs font-bold rounded-t-xl -mb-px transition-all ${activeTab === 'editor' ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>Editor</button>
                    <button onClick={() => setActiveTab('preview')} className={`px-6 py-2.5 text-xs font-bold rounded-t-xl -mb-px transition-all ${activeTab === 'preview' ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>Preview</button>
                </div>
                {activeTab === 'editor' ? 
                    <textarea value={templateContent} onChange={e => handleContentChange(e.target.value)} className="block w-full p-4 bg-slate-950 border border-t-0 border-slate-800 rounded-b-2xl shadow-inner h-60 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-300 custom-scrollbar" placeholder="Use placeholders like {{decision}}." /> 
                    : renderPreview()
                }
            </div>

            <details className="bg-slate-900 p-6 rounded-[24px] border border-white/5 overflow-hidden group shadow-xl">
                <summary className="font-bold text-slate-200 cursor-pointer flex items-center justify-between uppercase tracking-widest text-[10px]">
                    Reference Tools (Placeholders)
                    <ChevronDownIcon className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-6 space-y-8 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
                    {availableDefaultPlaceholders.length > 0 && (
                        <div>
                            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Standard Placeholders</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableDefaultPlaceholders.map(p => (
                                    <div key={p.placeholder} className="bg-slate-950 p-4 rounded-2xl border border-white/5 group/ph hover:border-indigo-500/30 transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <code className="text-xs font-black text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">{p.placeholder}</code>
                                            <button onClick={() => handleCopyPlaceholder(p.placeholder)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all">
                                                {copiedPlaceholder === p.placeholder ? <CheckCircleIcon className="w-4 h-4 text-emerald-400"/> : <CopyIcon className="w-4 h-4"/>}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">{p.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-6 border-t border-white/5">
                         <div className="flex justify-between items-center mb-4">
                            <h5 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Custom Placeholders</h5>
                            {!editingPlaceholder && <button onClick={handleAddNewPlaceholder} className="text-[10px] font-black px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition-all border border-cyan-500/20">+ Add New</button>}
                         </div>
                        {editingPlaceholder && (
                            <div className="p-6 bg-slate-950 border border-indigo-500/30 rounded-3xl mb-6 space-y-4 animate-slide-in-up">
                                <h5 className="text-xs font-black text-white uppercase tracking-widest">{editingPlaceholder?.id ? 'Edit' : 'Define'} Placeholder</h5>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">Name (Letters & Underscores only)</label>
                                    <div className="flex items-center group">
                                        <span className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-l-xl text-slate-500 font-mono text-sm border-r-0">{"{{"}</span>
                                        <input type="text" value={phName} onChange={e => { setPhName(e.target.value); setPhError(''); }} className="flex-1 p-2 bg-slate-900 border border-slate-800 shadow-inner text-white focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono" placeholder="e.g. project_lead" />
                                        <span className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-r-xl text-slate-500 font-mono text-sm border-l-0">{"}}"}</span>
                                    </div>
                                    {phError && <p className="text-red-400 text-[10px] mt-1 font-bold">{phError}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">Brief Description</label>
                                    <textarea value={phDesc} onChange={e => setPhDesc(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-inner text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none" rows={2} />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={handleCancelEditPlaceholder} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-all text-xs font-bold">Cancel</button>
                                    <button onClick={handleSavePlaceholder} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 transition-all text-xs font-bold">Save</button>
                                </div>
                            </div>
                        )}
                        {customPlaceholders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {customPlaceholders.map(p => (
                                    <div key={p.id} className="bg-slate-950 p-4 rounded-2xl border border-white/5 group/ph hover:border-cyan-500/30 transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <code className="text-xs font-black text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">{`{{${p.name}}}`}</code>
                                            <div className="flex gap-1 opacity-0 group-hover/ph:opacity-100 transition-opacity">
                                                <button onClick={() => handleCopyPlaceholder(`{{${p.name}}}`)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white"><CopyIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleEditPlaceholder(p)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white"><EditIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDeletePlaceholder(p.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500">{p.description}</p>
                                    </div>
                                ))}
                            </div>
                        ) : !editingPlaceholder && <p className="text-center text-slate-700 text-[10px] py-4 uppercase tracking-widest font-black">No Custom Placeholders</p>}
                    </div>
                </div>
            </details>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl flex justify-center items-center z-[100] p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-slate-900/50 rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/5 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-slate-900/80 rounded-t-[40px]">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">
                            {view === 'form' ? (currentTemplate ? 'Modify Template' : 'New Template') : (view === 'history' ? 'Version Logs' : 'Template Library')}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">Generator System Config</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 rounded-2xl transition-all shadow-lg active:scale-90" aria-label="Close">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
                    {toast && (
                        <div className={`p-4 mb-6 text-sm font-bold text-center rounded-2xl shadow-xl animate-slide-in-up border ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {toast.message}
                        </div>
                    )}
                    {view === 'list' && renderListView()}
                    {view === 'form' && renderFormView()}
                    {view === 'history' && renderHistoryView()}
                </div>
                
                <div className="px-8 py-6 bg-slate-950/50 border-t border-white/5 flex justify-end gap-3 sticky bottom-0 rounded-b-[40px] backdrop-blur-md">
                    {view === 'form' && <>
                        <button onClick={() => setView('list')} className="px-6 py-3 bg-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 transition-all shadow-md">Discard</button>
                        <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 active:scale-95 transition-all uppercase tracking-widest text-xs">Save Configuration</button>
                    </>}
                    {view === 'history' && <button onClick={() => setView('form')} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 active:scale-95 transition-all">Return to Editor</button>}
                </div>
            </div>
            {confirmAction && (
                <ConfirmationDialog
                    isOpen={!!confirmAction}
                    onClose={() => setConfirmAction(null)}
                    onConfirm={confirmAction.action}
                    title={confirmAction.title}
                    message={confirmAction.message}
                    confirmButtonText={confirmAction.confirmText}
                />
            )}
        </div>
    );
};

export default TemplateManager;
