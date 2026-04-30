
import React, { useState } from 'react';
import HomeIcon from './icons/HomeIcon';
import { enhanceMemoDescription, enhanceSubject } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import TrashIcon from './icons/TrashIcon';
import type { DocumentContent } from '../types';
import DocumentEditor from './DocumentEditor';
import EmailComposer from './EmailComposer';

interface Member {
    id: number;
    sl: string;
    name: string;
    role: 'Convener' | 'Member' | 'Member Secretary';
}

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

    // Format: Month Day, Year (e.g. December 2, 2025)
    return `${month} ${day}, ${year}`;
};

const CommitteeFormationGeneratorPage: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    // Form State
    const [universityName, setUniversityName] = useState('Daffodil International University (DIU)');
    const [universityAddress, setUniversityAddress] = useState('Daffodil Smart City (DSC), Birulia, Savar, Dhaka-1216, Bangladesh');
    const [memoBookNum, setMemoBookNum] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [appNum, setAppNum] = useState('');
    const [memoNum, setMemoNum] = useState('');
    const [date, setDate] = useState(formatDateForInput(new Date()));
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [members, setMembers] = useState<Member[]>([{ id: 1, sl: '1', name: '', role: 'Member' }]);
    
    const [cc, setCc] = useState(`Honorable Vice Chancellor
Honorable Pro-Vice Chancellor
Honorable Treasurer
Dr. Mohamed Emran Hossain, Honorable Member of BoT
Ms. Samiha Khan, Honorable Member of BoT
Honorable Dean, Academic Affairs
HR Section
Office of the Honorable Chairman
Office Copy`);
    
    // UI State
    const [error, setError] = useState<string | null>(null);
    const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);
    const [isEnhancingSubject, setIsEnhancingSubject] = useState(false);
    
    // Workflow State
    const [isGenerated, setIsGenerated] = useState(false);
    const [generatedDoc, setGeneratedDoc] = useState<DocumentContent | null>(null);
    const [showEmailComposer, setShowEmailComposer] = useState(false);

    // Member handlers
    const handleMemberChange = (id: number, field: keyof Omit<Member, 'id'>, value: string) => {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const addMember = () => {
        const nextSl = members.length > 0 ? String(parseInt(members[members.length - 1].sl) + 1) : '1';
        setMembers(prev => [...prev, { id: Date.now(), sl: nextSl, name: '', role: 'Member' }]);
    };

    const removeMember = (id: number) => {
        setMembers(prev => prev.filter(m => m.id !== id));
    };
    
    const constructRef = () => `DIU/Reg/Memo/${memoBookNum}/${year}/${appNum}/${memoNum}`;

    // Main actions
    const handleEnhanceDescription = async () => {
        if (!description.trim()) {
            setError('Please enter a description to enhance.');
            return;
        }
        setIsEnhancingDesc(true);
        setError(null);
        try {
            const enhanced = await enhanceMemoDescription(description);
            setDescription(enhanced);
        } catch (e: any) {
            setError(e.message || 'Failed to enhance description.');
        } finally {
            setIsEnhancingDesc(false);
        }
    };

    const handleEnhanceSubject = async () => {
         if (!subject.trim()) {
            setError('Please enter a subject to enhance.');
            return;
        }
        setIsEnhancingSubject(true);
        setError(null);
        try {
            const enhanced = await enhanceSubject(subject);
            setSubject(enhanced);
        } catch (e: any) {
             setError(e.message || 'Failed to enhance subject.');
        } finally {
            setIsEnhancingSubject(false);
        }
    }

    const handleGenerate = () => {
        if (!memoBookNum || !year || !appNum || !memoNum || !to || !subject || !description || members.some(m => !m.name.trim())) {
            setError('Please fill all required fields, including all committee member names.');
            return;
        }
        setError(null);
        
        // Construct body with Markdown table for the editor
        let bodyContent = description + '\n\n';
        
        // Add Members Table in Markdown
        bodyContent += '| SL | Details | Role |\n|---|---|---|\n';
        members.forEach(m => {
            bodyContent += `| ${m.sl} | ${m.name} | ${m.role} |\n`;
        });
        bodyContent += '\n';

        const doc: DocumentContent = {
            doc_id: `CF-${Date.now()}`,
            doc_type: 'committee_formation',
            ref: constructRef(),
            doc_date: formatDateForDisplay(date),
            from: 'Registrar',
            to: to,
            subject: subject,
            body: bodyContent,
            cc: cc.split('\n').filter(Boolean),
        };

        setGeneratedDoc(doc);
        setIsGenerated(true);
    };

    const handleDocUpdate = (updatedDoc: DocumentContent) => {
        setGeneratedDoc(updatedDoc);
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-200">
            {!isGenerated ? (
                <>
                <div className="shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white font-medium mb-1 text-sm transition-colors group">
                            <span className="p-1.5 rounded-full bg-slate-900 group-hover:bg-indigo-600 transition-colors mr-2 border border-white/5"><HomeIcon className="w-3 h-3" /></span>
                            Back to Home
                        </button>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center mt-2">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Committee Formation</span>
                        </h1>
                        <p className="text-slate-400 mt-1">Generate a formal university memorandum with precise formatting.</p>
                    </div>
                </div>
                <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 h-full">
                        {/* Left Panel: Form */}
                        <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl border border-white/5 flex flex-col">
                            <div className="flex-grow overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                                <h3 className="text-lg font-bold text-white flex items-center"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs mr-3">1</span> Memorandum Details</h3>
                                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">{error}</div>}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">University Name</label><input type="text" value={universityName} onChange={e => setUniversityName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all" /></div>
                                    <div><label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">University Address</label><input type="text" value={universityAddress} onChange={e => setUniversityAddress(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all" /></div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Ref Number</label>
                                    <div className="grid grid-cols-4 gap-2 items-center">
                                        <input type="text" value={memoBookNum} onChange={e => setMemoBookNum(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-center focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="Memo Book"/>
                                        <input type="text" value={year} onChange={e => setYear(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-center focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="Year"/>
                                        <input type="text" value={appNum} onChange={e => setAppNum(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-center focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="App No."/>
                                        <input type="text" value={memoNum} onChange={e => setMemoNum(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-center focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="Memo No."/>
                                    </div>
                                </div>
                                <div><label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" /></div>
                                <div><label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">To (Recipients)</label><textarea value={to} onChange={e => setTo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none resize-none" rows={2} placeholder="One recipient per line"/></div>
                                
                                <div>
                                     <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Subject</label>
                                        <button onClick={handleEnhanceSubject} disabled={isEnhancingSubject} className="flex items-center text-xs px-3 py-1.5 bg-indigo-500/10 text-indigo-400 font-bold rounded-lg hover:bg-indigo-500/20 disabled:opacity-50 transition-colors">
                                            {isEnhancingSubject ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400 mr-2"></div> : <SparklesIcon className="w-3 h-3 mr-1.5" />}
                                            Enhance
                                        </button>
                                     </div>
                                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Description Paragraph</label>
                                        <button onClick={handleEnhanceDescription} disabled={isEnhancingDesc} className="flex items-center text-xs px-3 py-1.5 bg-indigo-500/10 text-indigo-400 font-bold rounded-lg hover:bg-indigo-500/20 disabled:opacity-50 transition-colors">
                                            {isEnhancingDesc ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400 mr-2"></div> : <SparklesIcon className="w-3 h-3 mr-1.5" />}
                                            Enhance
                                        </button>
                                    </div>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none resize-none" rows={4} />
                                </div>

                                <div><label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">CC List</label><textarea value={cc} onChange={e => setCc(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none resize-none" rows={3} placeholder="One recipient per line"/></div>


                                <h3 className="text-lg font-bold text-white pt-4 flex items-center"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs mr-3">2</span> Committee Members</h3>
                                <div className="space-y-3">
                                    {members.map((member, index) => (
                                        <div key={member.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                                            <input type="text" value={member.sl} onChange={e => handleMemberChange(member.id, 'sl', e.target.value)} className="w-12 p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-center focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-sm"/>
                                            <input type="text" value={member.name} onChange={e => handleMemberChange(member.id, 'name', e.target.value)} placeholder={`Member Name ${index + 1}`} className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm"/>
                                            <select value={member.role} onChange={e => handleMemberChange(member.id, 'role', e.target.value)} className="p-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm max-w-[100px]">
                                                <option>Convener</option>
                                                <option>Member</option>
                                                <option>Member Secretary</option>
                                            </select>
                                            <button onClick={() => removeMember(member.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addMember} className="w-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors text-sm shadow-md">+ Add Member</button>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5">
                                 <button onClick={handleGenerate} className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold rounded-full shadow-lg shadow-indigo-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] transition-all transform">
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    Generate Memo
                                </button>
                            </div>
                        </div>
                        {/* Right Panel: Preview */}
                        <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 flex flex-col text-center relative overflow-hidden shadow-2xl min-h-[500px] lg:min-h-0">
                             {/* Background Grid */}
                             <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.1] pointer-events-none"></div>
                             
                             <h3 className="text-lg font-bold text-white mb-6 relative z-10">Live Preview</h3>
                            <div className="flex-grow w-full bg-white rounded-xl shadow-inner p-8 overflow-y-auto relative z-10 custom-scrollbar" style={{ fontFamily: '"Times New Roman", serif' }}>
                                <div className="text-left text-black min-h-full flex flex-col" style={{ lineHeight: 1.5 }}>
                                    <div className="flex-grow">
                                        <p className="text-center font-bold" style={{ fontSize: '14pt' }}>{universityName || '[University Name]'}</p>
                                        <p className="text-center" style={{ fontSize: '12pt', marginBottom: '1rem' }}>{universityAddress || '[University Address]'}</p>
                                        <p className="text-center font-bold" style={{ fontSize: '14pt', margin: '1.5rem 0' }}>Memorandum</p>
                                        <div style={{ fontSize: '12pt' }}>
                                            <div className="grid grid-cols-[100px_10px_1fr]">
                                                <span>Ref</span><span>:</span><span>{constructRef() || '[Ref Number]'}</span>
                                                <span>Date</span><span>:</span><span>{date ? formatDateForDisplay(date) : '[Date]'}</span>
                                                <span>From</span><span>:</span><span>Registrar</span>
                                                <span>To</span><span>:</span><div className="whitespace-pre-wrap">{to || '[Recipients]'}</div>
                                            </div>
                                            
                                            <p className="mt-4"><strong className="font-bold">Subject:</strong> {subject || '[Subject]'}</p>
                                            
                                            <p className="mt-4 text-justify" style={{ lineHeight: 1.15 }}>{description || '[Description paragraph...]'}</p>
                                            
                                            {members.length > 0 && (
                                                <div className="mt-4">
                                                    <table className="w-full border-collapse border border-black">
                                                        <thead>
                                                            <tr>
                                                                <th className="border border-black p-1">SL</th>
                                                                <th className="border border-black p-1">Details</th>
                                                                <th className="border border-black p-1">Role</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {members.map(m => (
                                                                <tr key={m.id}>
                                                                    <td className="border border-black p-1 text-center">{m.sl}</td>
                                                                    <td className="border border-black p-1">{m.name}</td>
                                                                    <td className="border border-black p-1">{m.role}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                        {cc && <div className="mt-4" style={{ fontSize: '12pt' }}>
                                            <p><strong className="font-bold">Cc:</strong></p>
                                            {cc.split('\n').filter(Boolean).map((l, i) => <p key={i} style={{margin: 0}}>{l}</p>)}
                                        </div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </>
            ) : (
                <>
                <div className="shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <button onClick={() => setIsGenerated(false)} className="flex items-center text-slate-400 hover:text-white font-medium mb-1 text-sm transition-colors group">
                            <span className="p-1.5 rounded-full bg-slate-900 group-hover:bg-indigo-600 transition-colors mr-2 border border-white/5"><HomeIcon className="w-3 h-3" /></span>
                            Back to Edit Form
                        </button>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-2">Edit & Finalize Memo</h1>
                    </div>
                </div>
                <div className="flex-grow overflow-hidden relative">
                     {/* Background Grid */}
                     <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.1] pointer-events-none"></div>
                     {generatedDoc && (
                        <DocumentEditor
                            document={generatedDoc}
                            allDocs={[generatedDoc]}
                            onSave={handleDocUpdate}
                            onEmail={() => setShowEmailComposer(true)}
                            onEmailAll={() => setShowEmailComposer(true)}
                            onSelectDoc={() => {}}
                        />
                    )}
                </div>
                 {showEmailComposer && generatedDoc && (
                    <EmailComposer document={generatedDoc} onClose={() => setShowEmailComposer(false)} />
                )}
                </>
            )}
        </div>
    );
};

export default CommitteeFormationGeneratorPage;
