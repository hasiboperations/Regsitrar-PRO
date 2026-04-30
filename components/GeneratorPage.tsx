import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Page } from '../App';
import type { Template, DocumentContent, DocumentType } from '../types';
import { generateDocument, generateDocumentFromFile, GlobalSettings, extractTextFromFile } from '../services/geminiService';
import * as templateService from '../services/templateService';
import { MEETING_COMMITTEES } from '../constants/templates';
import FileUpload from './FileUpload';
import TemplateManager from './TemplateManager';
import SkeletonLoader from './SkeletonLoader';
import SparklesIcon from './icons/SparklesIcon';
import DocumentIcon from './icons/DocumentIcon';
import DocumentEditor from './DocumentEditor';
import EmailComposer from './EmailComposer';
import SearchIcon from './icons/SearchIcon';
import MenuIcon from './icons/MenuIcon';
import CloseIcon from './icons/CloseIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface GeneratorPageProps {
  onBack: () => void;
  title: string;
  description: string;
  templates: Template[];
  generatorType: Exclude<Page, 'landing'>;
}

const AccordionSection: React.FC<{
    id: string;
    title: string;
    number: string;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ id, title, number, children, isExpanded, onToggle }) => {
    return (
        <section className="mb-4">
            <button 
                onClick={onToggle}
                className="w-full flex items-center justify-between text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 focus:outline-none group p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
            >
                <div className="flex items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 border transition-colors ${isExpanded ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{number}</span>
                    <span className={`group-hover:text-slate-300 transition-colors ${isExpanded ? 'text-white' : ''}`}>{title}</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : 'text-slate-500'}`} />
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pt-2 pb-4 px-1">
                    {children}
                </div>
            </div>
            <div className="h-px bg-white/5 my-2"></div>
        </section>
    );
};

const GeneratorPage: React.FC<GeneratorPageProps> = ({ onBack, title, description, templates, generatorType }) => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  const [generatedDocs, setGeneratedDocs] = useState<DocumentContent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
      meetingName: '',
      meetingNumber: '',
      memoBookNumber: '',
      date: (() => {
        const d = new Date();
        return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getDate()}, ${d.getFullYear()}`;
      })(),
      starterLine: templates.find(t => t.isDefault)?.content || ''
  });
  
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<'file' | 'text'>('file');

  const [appliedSettings, setAppliedSettings] = useState<GlobalSettings | null>(null);
  
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailComposerMode, setEmailComposerMode] = useState<'single' | 'all'>('single');

  const [isGrammarCheckOpen, setIsGrammarCheckOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['details', 'source', 'template']));

  const toggleSection = (section: string) => {
      setExpandedSections(prev => {
          const newSet = new Set(prev);
          if (newSet.has(section)) {
              newSet.delete(section);
          } else {
              newSet.add(section);
          }
          return newSet;
      });
  };

  const selectedDoc = useMemo(() => {
    if (!generatedDocs || !selectedDocId) return null;
    return generatedDocs.find(d => d.doc_id === selectedDocId) || generatedDocs[0] || null;
  }, [generatedDocs, selectedDocId]);

  const handleUpdateDoc = (updatedDoc: DocumentContent) => {
    setGeneratedDocs(prevDocs => {
        if (!prevDocs) return null;
        const newDocs = prevDocs.map(doc => doc.doc_id === updatedDoc.doc_id ? updatedDoc : doc);
        localStorage.setItem(`generated-docs-${generatorType}`, JSON.stringify(newDocs));
        return newDocs;
    });
  };

  const refreshTemplates = () => {
    const customTemplates = templateService.getCustomTemplates(generatorType as DocumentType);
    const combinedTemplates = [...templates, ...customTemplates];
    setAllTemplates(combinedTemplates);

    if (!combinedTemplates.some(t => t.id === selectedTemplateId)) {
        const defaultTemplate = combinedTemplates.find(t => t.isDefault) || (combinedTemplates.length > 0 ? combinedTemplates[0] : null);
        if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id);
        }
    }
  };

  useEffect(() => {
    const savedDocs = localStorage.getItem(`generated-docs-${generatorType}`);
    const savedSettings = localStorage.getItem(`applied-settings-${generatorType}`);
    const latestProceedingsData = localStorage.getItem('latestProceedingsData');

    if (generatorType === 'meeting_memo' && latestProceedingsData) {
        try {
            const data = JSON.parse(latestProceedingsData);
            setGlobalSettings(prev => ({ ...prev, ...data.globalSettings }));
            setSourceText(data.sourceText);
            setActiveInput('text');
        } catch(e) {
            console.error("Failed to parse proceedings data from localStorage", e);
        }
    } else if (savedDocs) {
        setGeneratedDocs(JSON.parse(savedDocs));
        if(savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setAppliedSettings(parsed);
            setGlobalSettings(parsed);
        }
    }
    
    refreshTemplates();
    const defaultTemplate = [...templates, ...templateService.getCustomTemplates(generatorType as DocumentType)].find(t => t.isDefault);
    if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
        if (generatorType === 'meeting_memo') {
            setGlobalSettings(prev => ({...prev, starterLine: defaultTemplate.content}));
        }
    }
  }, [generatorType, templates]);

  useEffect(() => {
      if (generatedDocs && generatedDocs.length > 0) {
          const deepLinkDocId = sessionStorage.getItem('open_doc_id');
          if (deepLinkDocId) {
              const targetDoc = generatedDocs.find(d => d.doc_id === deepLinkDocId);
              if (targetDoc) {
                  setSelectedDocId(deepLinkDocId);
                  sessionStorage.removeItem('open_doc_id');
              } else {
                  if (!selectedDocId) setSelectedDocId(generatedDocs[0].doc_id);
              }
          } else {
              if (!selectedDocId) setSelectedDocId(generatedDocs[0].doc_id);
          }
      }
  }, [generatedDocs]);

  const handleGlobalSettingUpdate = (field: string, value: string) => {
    const previousSettings = { ...globalSettings };
    const newSettings = { ...globalSettings, [field]: value } as GlobalSettings;
    setGlobalSettings(newSettings);

    if (!generatedDocs || !appliedSettings) return;

    const oldCode = MEETING_COMMITTEES[previousSettings.meetingName] || '';
    const oldPrefix = `DIU/Reg./${oldCode}-${previousSettings.meetingNumber}`;
    const oldYear = new Date(previousSettings.date).getFullYear().toString();

    const newCode = MEETING_COMMITTEES[newSettings.meetingName] || '';
    const newPrefix = `DIU/Reg./${newCode}-${newSettings.meetingNumber}`;
    const newDate = newSettings.date;
    const newYear = new Date(newDate).getFullYear().toString();
    
    const updatedDocs = generatedDocs.map(doc => {
        let newRef = doc.ref;
        if (oldPrefix !== newPrefix) {
            newRef = newRef.replace(oldPrefix, newPrefix);
        }
        if (field === 'date' && oldYear !== newYear) {
             const refParts = newRef.split('/');
             if (refParts.length > 1) {
                 const yearIndex = refParts.findIndex(p => p === oldYear);
                 if (yearIndex !== -1) refParts[yearIndex] = newYear;
                 newRef = refParts.join('/');
             }
        }
        
        if (field === 'memoBookNumber') {
             const refParts = newRef.split('/');
             const memoIndex = refParts.indexOf('Memo');
             if (memoIndex !== -1 && refParts[memoIndex + 1]) {
                 refParts[memoIndex + 1] = value.padStart(2, '0');
                 newRef = refParts.join('/');
             }
        }

        let newBody = doc.body;
        if (field === 'starterLine' && appliedSettings.starterLine !== value) {
             if (newBody.startsWith(appliedSettings.starterLine)) {
                 newBody = value + newBody.substring(appliedSettings.starterLine.length);
             }
        }

        return {
            ...doc,
            ref: newRef,
            doc_date: field === 'date' ? newDate : doc.doc_date,
            body: newBody
        };
    });
    
    setGeneratedDocs(updatedDocs);
    setAppliedSettings(newSettings);
    localStorage.setItem(`generated-docs-${generatorType}`, JSON.stringify(updatedDocs));
    localStorage.setItem(`applied-settings-${generatorType}`, JSON.stringify(newSettings));
  };

  useEffect(() => {
      if (generatorType !== 'meeting_memo') return;

      const performExtraction = async () => {
          let content = '';
          if (activeInput === 'file' && sourceFile) {
              try {
                  content = await extractTextFromFile(sourceFile);
              } catch (e) {
                  console.warn("Failed to extract text for auto-fill", e);
                  return;
              }
          } else if (activeInput === 'text') {
              content = sourceText;
          }

          if (!content) return;

          let foundNumber = '';
          const explicitMatch = content.match(/(?:Meeting|Agenda)\s+(?:No\.?|Number|#)\s*[:.-]?\s*(\d+)/i);
          const ordinalMatch = content.match(/\b(\d+(?:st|nd|rd|th))\s+(?:Meeting|Agenda)/i);
          
          if (explicitMatch) {
              foundNumber = explicitMatch[1];
          } else if (ordinalMatch) {
              foundNumber = ordinalMatch[1];
          } else {
             const looseOrdinal = content.match(/\b(\d+(?:st|nd|rd|th))\b/i);
             if (looseOrdinal) {
                 const isDate = new RegExp(`\\b${looseOrdinal[1]}\\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)`, 'i').test(content);
                 if (!isDate) foundNumber = looseOrdinal[1];
             }
          }

          if (foundNumber && foundNumber !== globalSettings.meetingNumber) {
              handleGlobalSettingUpdate('meetingNumber', foundNumber);
          }

          let foundName = '';
          for (const key of Object.keys(MEETING_COMMITTEES)) {
              if (content.toLowerCase().includes(key.toLowerCase())) {
                  foundName = key;
                  break;
              }
          }
          if (foundName && foundName !== globalSettings.meetingName) {
              handleGlobalSettingUpdate('meetingName', foundName);
          }
      };

      const timer = setTimeout(performExtraction, 1000);
      return () => clearTimeout(timer);
  }, [sourceFile, sourceText, activeInput, generatorType]);

  const handleFileChange = (file: File) => {
    setSourceFile(file);
    setError(null);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedDocs([]);
    setAppliedSettings(globalSettings);
    localStorage.setItem(`applied-settings-${generatorType}`, JSON.stringify(globalSettings));
    setIsMobileSidebarOpen(false);

    const callbacks = {
        onData: (doc: DocumentContent) => {
            setGeneratedDocs(prev => {
                const newDocs = prev ? [...prev, doc] : [doc];
                if (!selectedDocId && newDocs.length === 1) setSelectedDocId(doc.doc_id);
                localStorage.setItem(`generated-docs-${generatorType}`, JSON.stringify(newDocs));
                return newDocs;
            });
        },
        onComplete: () => {
            setIsLoading(false);
        },
        onError: (err: Error) => {
            setError(err.message);
            setIsLoading(false);
        }
    };

    try {
        if (activeInput === 'file' && sourceFile) {
            await generateDocumentFromFile(sourceFile, generatorType as DocumentType, selectedTemplateId, callbacks, globalSettings);
        } else if (activeInput === 'text' && sourceText) {
            await generateDocument(sourceText, generatorType as DocumentType, selectedTemplateId, callbacks, globalSettings);
        } else {
            setError("Please provide source content (file or text).");
            setIsLoading(false);
        }
    } catch (e: any) {
        setError(e.message);
        setIsLoading(false);
    }
  };

  const handleClear = () => {
      setGeneratedDocs(null);
      setSelectedDocId(null);
      setSourceFile(null);
      setSourceText('');
      setError(null);
      setAppliedSettings(null);
      localStorage.removeItem(`generated-docs-${generatorType}`);
      localStorage.removeItem(`applied-settings-${generatorType}`);
      if (generatorType === 'meeting_memo') {
          localStorage.removeItem('latestProceedingsData');
      }
  };

  const handleEmailAll = () => {
      setEmailComposerMode('all');
      setShowEmailComposer(true);
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-200 relative">
      
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-white/10 sticky top-0 z-40">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2.5 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors active:scale-95"
          >
              <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white truncate">{title}</h1>
          <div className="w-10"></div>
      </div>

      <TemplateManager 
        isOpen={isTemplateManagerOpen} 
        onClose={() => setIsTemplateManagerOpen(false)}
        generatorType={generatorType as DocumentType}
        onUpdate={refreshTemplates}
        defaultTemplates={templates}
      />

      {showEmailComposer && selectedDoc && (
        <EmailComposer 
            document={selectedDoc} 
            allDocs={generatedDocs || []} 
            onClose={() => setShowEmailComposer(false)}
            selectAllByDefault={emailComposerMode === 'all'}
        />
      )}

      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
        
        {!isGrammarCheckOpen && (
            <>
                {isMobileSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                <div className={`
                    fixed inset-y-0 left-0 z-50 w-80 sm:w-96 bg-slate-900 border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out
                    lg:static lg:transform-none lg:w-[400px] xl:w-[450px] lg:border-r lg:border-white/5 lg:bg-slate-900/50 lg:shadow-none lg:z-20
                    flex flex-col h-full
                    ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-slate-900">
                        <h2 className="text-lg font-bold text-white">Settings</h2>
                        <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white active:scale-95">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-2">
                        
                        <AccordionSection 
                            id="source" 
                            title="Source Content" 
                            number="1"
                            isExpanded={expandedSections.has('source')}
                            onToggle={() => toggleSection('source')}
                        >
                            <div className="flex bg-slate-800/50 rounded-lg p-1 mb-4 border border-slate-700/50">
                                <button 
                                    onClick={() => setActiveInput('file')}
                                    className={`flex-1 py-2.5 text-xs font-bold rounded-md transition-all ${activeInput === 'file' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                                >
                                    Upload File
                                </button>
                                <button 
                                    onClick={() => setActiveInput('text')}
                                    className={`flex-1 py-2.5 text-xs font-bold rounded-md transition-all ${activeInput === 'text' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                                >
                                    Paste Text
                                </button>
                            </div>

                            {activeInput === 'file' ? (
                                <div className="animate-fade-in">
                                    {sourceFile ? (
                                        <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                                            <div className="flex items-center truncate mr-3">
                                                <DocumentIcon className="w-5 h-5 text-indigo-400 mr-2 shrink-0" />
                                                <span className="text-sm text-indigo-200 truncate">{sourceFile.name}</span>
                                            </div>
                                            <button onClick={() => setSourceFile(null)} className="text-xs text-indigo-400 hover:text-white font-medium px-2 py-1 hover:bg-indigo-500/20 rounded transition-colors">Change</button>
                                        </div>
                                    ) : (
                                        <FileUpload onFileSelect={handleFileChange} title="Upload Minutes/Agenda" buttonText="Browse" />
                                    )}
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <textarea
                                        value={sourceText}
                                        onChange={(e) => setSourceText(e.target.value)}
                                        className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none custom-scrollbar transition-all"
                                        placeholder="Paste meeting minutes or agenda here..."
                                    />
                                </div>
                            )}
                        </AccordionSection>

                        {generatorType === 'meeting_memo' && (
                            <AccordionSection 
                                id="details" 
                                title="Meeting Details" 
                                number="2"
                                isExpanded={expandedSections.has('details')}
                                onToggle={() => toggleSection('details')}
                            >
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500 font-semibold ml-1">Meeting Name</label>
                                        <select 
                                            value={globalSettings.meetingName} 
                                            onChange={(e) => handleGlobalSettingUpdate('meetingName', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm font-medium text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer hover:bg-slate-750 transition-colors appearance-none"
                                        >
                                            <option value="" disabled>Select Meeting</option>
                                            {Object.keys(MEETING_COMMITTEES).map(key => (
                                                <option key={key} value={key}>{key}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 font-semibold ml-1">Meeting No.</label>
                                            <input 
                                                type="text" 
                                                value={globalSettings.meetingNumber} 
                                                onChange={(e) => handleGlobalSettingUpdate('meetingNumber', e.target.value)}
                                                placeholder="e.g. 114"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none hover:bg-slate-750 transition-colors placeholder-slate-600"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 font-semibold ml-1">Book No.</label>
                                            <input 
                                                type="text" 
                                                value={globalSettings.memoBookNumber} 
                                                onChange={(e) => handleGlobalSettingUpdate('memoBookNumber', e.target.value)}
                                                placeholder="e.g. 02"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none hover:bg-slate-750 transition-colors placeholder-slate-600"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500 font-semibold ml-1">Date</label>
                                        <input 
                                            type="date" 
                                            value={(() => {
                                                const d = new Date(globalSettings.date);
                                                return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
                                            })()}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (!val) return;
                                                const [y, m, d] = val.split('-').map(Number);
                                                const dateObj = new Date(y, m - 1, d);
                                                const formatted = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                                                handleGlobalSettingUpdate('date', formatted);
                                            }}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none hover:bg-slate-750 transition-colors"
                                        />
                                    </div>
                                </div>
                            </AccordionSection>
                        )}

                        {allTemplates.length > 0 && (
                            <AccordionSection 
                                id="template" 
                                title="Template" 
                                number="3"
                                isExpanded={expandedSections.has('template')}
                                onToggle={() => toggleSection('template')}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-500">Select Template</span>
                                    <button onClick={() => setIsTemplateManagerOpen(true)} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium p-1">Manage</button>
                                </div>
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => {
                                        setSelectedTemplateId(e.target.value);
                                        const selected = allTemplates.find(t => t.id === e.target.value);
                                        if (selected && generatorType === 'meeting_memo') {
                                            handleGlobalSettingUpdate('starterLine', selected.content);
                                        }
                                    }}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
                                >
                                    {allTemplates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </AccordionSection>
                        )}

                        <div className="pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || (!sourceFile && !sourceText)}
                                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-[0_6px_0_#312e81] hover:bg-indigo-500 active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none flex justify-center items-center gap-2 uppercase tracking-wider"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        <span>Generate Documents</span>
                                    </>
                                )}
                            </button>
                            {error && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                                    <span className="font-bold block mb-1">Error:</span> {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        )}

        <div className="flex-grow flex flex-col min-h-0 bg-slate-950 relative z-10 w-full">
            {generatedDocs && generatedDocs.length > 0 ? (
                <div className="flex flex-col h-full">
                    
                    <div className="shrink-0 px-4 py-2 border-b border-white/5 flex items-center justify-between bg-slate-900/30">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:inline">Showing:</span>
                            <span className="text-xs font-bold text-cyan-400 truncate max-w-[150px] sm:max-w-[200px]">{selectedDoc?.subject || 'Select a document'}</span>
                        </div>
                        <button onClick={handleClear} className="text-xs text-slate-500 hover:text-red-400 font-medium px-3 py-1.5 hover:bg-slate-900 rounded transition-colors whitespace-nowrap active:scale-95">
                            Clear Results
                        </button>
                    </div>

                    <div className="flex-grow overflow-hidden relative bg-slate-950 flex flex-col h-full w-full">
                        {selectedDoc ? (
                            <DocumentEditor
                                key={selectedDoc.doc_id}
                                document={selectedDoc}
                                allDocs={generatedDocs}
                                onSave={handleUpdateDoc}
                                onEmail={() => {
                                    setEmailComposerMode('single');
                                    setShowEmailComposer(true);
                                }}
                                onEmailAll={handleEmailAll}
                                onSelectDoc={setSelectedDocId}
                                isGrammarCheckOpen={isGrammarCheckOpen}
                                onToggleGrammarCheck={setIsGrammarCheckOpen}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                <div className="text-center">
                                    <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Select a document from the search bar above to view and edit</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-600 bg-slate-950/50">
                    {isLoading ? (
                        <div className="max-w-md w-full">
                            <SkeletonLoader />
                        </div>
                    ) : (
                        <div className="max-w-sm">
                            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/5">
                                <SparklesIcon className="w-8 h-8 text-indigo-500/50" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-300 mb-2">Ready to Generate</h3>
                            <p className="text-slate-500">
                                <span className="lg:hidden">Tap the menu button above to configure.</span>
                                <span className="hidden lg:inline">Configure your settings on the left.</span>
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorPage;