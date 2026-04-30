
import React, { useState, useEffect } from 'react';
import type { DocumentContent } from '../types';
import * as settingsService from '../services/settingsService';
import { getDocumentBlob } from '../services/docxService';
import CloseIcon from './icons/CloseIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import SparklesIcon from './icons/SparklesIcon';

interface EmailComposerProps {
  document: DocumentContent;
  allDocs?: DocumentContent[];
  onClose: () => void;
  selectAllByDefault?: boolean;
  getBlob?: () => Promise<Blob>; // Optional prop for custom blob generation
  onAiAssist?: (field: 'subject' | 'message', currentValue: string) => Promise<string>;
}

const EmailComposer: React.FC<EmailComposerProps> = ({ document, allDocs, onClose, selectAllByDefault = false, getBlob, onAiAssist }) => {
  const [to, setTo] = useState(() => {
    return document.to
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean)
      .join(', ');
  });
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(document.subject);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEnhancingField, setIsEnhancingField] = useState<'subject' | 'message' | null>(null);
  
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(() => {
      if (selectAllByDefault && allDocs) {
          return new Set(allDocs.map(d => d.doc_id));
      }
      return new Set([document.doc_id]);
  });

  useEffect(() => {
    const settings = settingsService.getSettings();
    setCc(settings.defaultCc);
    setBcc(settings.defaultBcc);

    const signatureBlock = settings.signature ? `\n\n--\n${settings.signature}` : '';
    setBody(document.body + signatureBlock);
    
  }, [document]);

  const toggleDocSelection = (docId: string) => {
      const newSelection = new Set(selectedDocIds);
      if (newSelection.has(docId)) {
          newSelection.delete(docId);
      } else {
          newSelection.add(docId);
      }
      setSelectedDocIds(newSelection);
  };

  const handleAiAssist = async (field: 'subject' | 'message') => {
      if (!onAiAssist) return;
      
      const currentValue = field === 'subject' ? subject : body;
      if (!currentValue.trim()) return;

      setIsEnhancingField(field);
      try {
          const enhancedValue = await onAiAssist(field, currentValue);
          if (field === 'subject') {
              setSubject(enhancedValue);
          } else {
              setBody(enhancedValue);
          }
      } catch (error) {
          console.error("AI Assist failed:", error);
          alert("Failed to improve text. Please try again.");
      } finally {
          setIsEnhancingField(null);
      }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
             const base64String = reader.result as string;
             // Remove data url prefix if present
             const base64Data = base64String.split(',')[1] || base64String;
             resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
  };

  const sendEmail = async () => {
    if (isSending) return;
    if (selectedDocIds.size === 0) {
        alert("Please select at least one document to attach.");
        return;
    }

    setIsSending(true);
    try {
        let attachments: { filename: string, content: string }[] = [];

        if (getBlob) {
            // Custom blob generation (e.g., Agenda)
            const blob = await getBlob();
            const base64Content = await blobToBase64(blob);
            const safeSubject = subject.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            attachments.push({
                filename: `${safeSubject || 'Document'}.docx`,
                content: base64Content
            });
        } else {
            // Standard multi-doc selection
            const docsToSend = allDocs 
                ? allDocs.filter(d => selectedDocIds.has(d.doc_id))
                : [document]; // Fallback if allDocs not provided

            attachments = await Promise.all(docsToSend.map(async (doc) => {
                const blob = await getDocumentBlob(doc);
                const base64Content = await blobToBase64(blob);
                const safeSubject = doc.subject.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
                return {
                    filename: `${safeSubject || 'Document'}.docx`,
                    content: base64Content
                };
            }));
        }

        const response = await fetch("/api/sendEmail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                to, 
                cc, 
                bcc, 
                subject, 
                message: body,
                attachments
            }),
        });

        // Check if the response is actually JSON (handles 404/500 HTML errors from dev server)
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
             throw new Error(`Server returned ${response.status}. Ensure the API route is correctly configured.`);
        }

        const result = await response.json();

        if (response.ok && result.success) {
            alert("Email sent successfully!");
            onClose();
        } else {
            throw new Error(result.error || "Failed to send email.");
        }
    } catch (error: any) {
        console.error("Error sending email:", error);
        alert(`Failed to send email: ${error.message}`);
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-end sm:items-center z-[100] p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-indigo-500/20 flex justify-between items-center shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
          <h3 className="text-xl font-bold text-white flex items-center">
             <PaperAirplaneIcon className="w-5 h-5 mr-2 text-indigo-200" />
             Compose Email
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors" aria-label="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div>
                    <label htmlFor="to" className="block text-sm font-bold text-gray-700 mb-1">To</label>
                    <input
                    type="text"
                    id="to"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="recipient@example.com"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="cc" className="block text-sm font-bold text-gray-700 mb-1">Cc</label>
                        <input
                        type="text"
                        id="cc"
                        value={cc}
                        onChange={e => setCc(e.target.value)}
                        className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="cc@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="bcc" className="block text-sm font-bold text-gray-700 mb-1">Bcc</label>
                        <input
                        type="text"
                        id="bcc"
                        value={bcc}
                        onChange={e => setBcc(e.target.value)}
                        className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="bcc@example.com"
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="subject" className="block text-sm font-bold text-gray-700">Subject</label>
                        {onAiAssist && (
                            <button 
                                onClick={() => handleAiAssist('subject')}
                                disabled={isEnhancingField === 'subject'}
                                className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                title="Improve with AI"
                            >
                                {isEnhancingField === 'subject' ? (
                                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                                ) : (
                                    <SparklesIcon className="w-3 h-3 mr-1" />
                                )}
                                AI Assist
                            </button>
                        )}
                    </div>
                    <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="mt-1 block w-full p-2.5 border border-gray-300 rounded-xl shadow-sm font-semibold text-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="body" className="block text-sm font-bold text-gray-700">Message</label>
                        {onAiAssist && (
                            <button 
                                onClick={() => handleAiAssist('message')}
                                disabled={isEnhancingField === 'message'}
                                className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                title="Improve with AI"
                            >
                                {isEnhancingField === 'message' ? (
                                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                                ) : (
                                    <SparklesIcon className="w-3 h-3 mr-1" />
                                )}
                                AI Assist
                            </button>
                        )}
                    </div>
                    <textarea
                    id="body"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm flex-1 min-h-[150px] text-black resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>
            
            {!getBlob && allDocs && allDocs.length > 0 && (
                <div className="w-full md:w-72 bg-slate-50 border-l border-gray-200 p-4 overflow-y-auto">
                    <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center">
                        Attachments <span className="ml-2 bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full">{selectedDocIds.size}</span>
                    </h4>
                    <div className="space-y-2">
                        {allDocs.map(doc => (
                            <div 
                                key={doc.doc_id}
                                onClick={() => toggleDocSelection(doc.doc_id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedDocIds.has(doc.doc_id)
                                    ? 'bg-white border-indigo-300 ring-2 ring-indigo-100 shadow-sm'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                        selectedDocIds.has(doc.doc_id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                                    }`}>
                                        {selectedDocIds.has(doc.doc_id) && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-semibold truncate ${selectedDocIds.has(doc.doc_id) ? 'text-indigo-900' : 'text-gray-700'}`}>
                                            {doc.subject || 'Untitled Document'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{doc.doc_id}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-3 shrink-0 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
            Cancel
          </button>
          <button 
            onClick={sendEmail} 
            disabled={isSending || selectedDocIds.size === 0}
            className="flex items-center px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-purple-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none transition-all"
          >
            {isSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
            )}
            {isSending ? 'Sending...' : `Send Email`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;
