import React, { useState, useCallback, useMemo } from 'react';
import { getGenAI } from '../services/geminiService';
import { generateExtractedTextDocx } from '../services/docxService';
import HomeIcon from './icons/HomeIcon';
import FileUpload from './FileUpload';
import SparklesIcon from './icons/SparklesIcon';
import ImageIcon from './icons/ImageIcon';
import DownloadIcon from './icons/DownloadIcon';
import DocumentIcon from './icons/DocumentIcon';

// Helper to convert a File object to a base64 string, removing the data URL prefix.
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // The result is "data:image/jpeg;base64,....", we need to remove the prefix.
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const ImageEditorPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const originalImagePreview = useMemo(() => {
        if (!originalImageFile) return null;
        return URL.createObjectURL(originalImageFile);
    }, [originalImageFile]);

    const handleFileSelect = useCallback((file: File) => {
        setOriginalImageFile(file);
        setExtractedText(null);
        setError(null);
    }, []);

    const handleStartOver = () => {
        setOriginalImageFile(null);
        setPrompt('');
        setExtractedText(null);
        setIsLoading(false);
        setError(null);
    };
    
    const handleGenerate = async () => {
        if (!originalImageFile) {
            setError('Please upload an image first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setExtractedText(null);

        try {
            const base64Data = await fileToBase64(originalImageFile);
            const ai = getGenAI();

            const fullPrompt = "Extract all text from this image. " + (prompt ? `Additional Instructions: ${prompt}` : "");

            // FIX: Using gemini-3-flash-preview for high-quality OCR and institutional context analysis
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: originalImageFile.type } },
                        { text: fullPrompt }
                    ]
                }
            });

            if (response.text) {
                setExtractedText(response.text);
            } else {
                setError("No text was extracted. The image might be unclear or contain no text.");
            }

        } catch (e: any) {
            console.error("Error calling Gemini API:", e);
            setError(`Failed to extract text. Details: ${e.message}`);
        } finally {
            // FIX: Replaced undefined setIsGenerating with isLoading setter
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (extractedText) {
            generateExtractedTextDocx(extractedText);
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
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Image to Text</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Extract text from images using advanced AI analysis.</p>
                </div>
            </div>
            
            <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 h-full">
                    {/* Left Panel: Upload & Config */}
                    <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl border border-white/5 flex flex-col">
                        <h3 className="text-lg font-bold text-white flex items-center mb-6"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 text-xs mr-3">1</span> Upload & Configure</h3>
                        
                        <div className="space-y-6 flex-grow">
                            {!originalImageFile ? (
                                <FileUpload onFileSelect={handleFileSelect} title="Upload Image" buttonText="Browse" accept="image/*" />
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black/50 aspect-video flex items-center justify-center group">
                                        <img src={originalImagePreview || ''} alt="Uploaded" className="max-w-full max-h-full object-contain" />
                                        <button 
                                            onClick={handleStartOver}
                                            className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remove Image"
                                        >
                                            <span className="text-xs font-bold">✕</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                                        <div className="flex items-center truncate mr-3">
                                            <ImageIcon className="w-5 h-5 text-indigo-400 mr-2 shrink-0" />
                                            <span className="text-sm text-indigo-200 truncate">{originalImageFile.name}</span>
                                        </div>
                                        <button onClick={handleStartOver} className="text-xs text-indigo-400 hover:text-white font-medium px-2 py-1 hover:bg-indigo-500/20 rounded transition-colors">Change</button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Additional Instructions (Optional)</label>
                                <textarea 
                                    value={prompt} 
                                    onChange={e => setPrompt(e.target.value)} 
                                    className="w-full p-4 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none shadow-inner placeholder-slate-600" 
                                    placeholder="E.g., Extract only the table data, or translate to English..." 
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5">
                             {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium mb-4" role="alert">{error}</div>}
                             <button 
                                onClick={handleGenerate} 
                                disabled={isLoading || !originalImageFile}
                                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isLoading 
                                    ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    : <SparklesIcon className="w-5 h-5 mr-2" />
                                }
                                {isLoading ? 'Extracting Text...' : 'Extract Text'}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Results */}
                    <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 flex flex-col shadow-2xl min-h-[500px] lg:min-h-0 relative overflow-hidden">
                         {/* Background Grid */}
                         <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.1] pointer-events-none"></div>
                         
                         <h3 className="text-lg font-bold text-white mb-6 relative z-10 flex items-center"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 text-xs mr-3">2</span> Extracted Result</h3>
                         
                         <div className="flex-grow w-full bg-slate-900 rounded-xl shadow-inner border border-slate-800 p-1 relative z-10 overflow-hidden flex flex-col">
                            {extractedText ? (
                                <textarea
                                    value={extractedText}
                                    onChange={(e) => setExtractedText(e.target.value)}
                                    className="w-full h-full p-4 bg-transparent text-slate-300 font-mono text-sm resize-none outline-none custom-scrollbar"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                                    <DocumentIcon className="w-12 h-12 mb-3 opacity-50" />
                                    <p>Extracted text will appear here.</p>
                                </div>
                            )}
                         </div>

                         <div className="mt-6 shrink-0 relative z-10">
                            <button
                                onClick={handleDownload}
                                disabled={!extractedText}
                                className="w-full flex items-center justify-center px-6 py-4 bg-teal-600 text-white font-bold rounded-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:bg-teal-500 transition-all transform hover:-translate-y-0.5 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <DownloadIcon className="w-5 h-5 mr-2" />
                                Download as Word
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditorPage;
