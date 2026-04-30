
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import ChatBubbleIcon from './icons/ChatBubbleIcon';
import CloseIcon from './icons/CloseIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import UserIcon from './icons/UserIcon';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

interface Message {
    id?: string;
    text: string;
    sender: 'user' | 'admin';
    timestamp: any;
}

const ChatSupportWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'form' | 'chat'>('form');
    
    // User Details
    const [fullName, setFullName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    
    // Chat Session
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Real-time Listener for Messages (Admin Replies)
    useEffect(() => {
        let unsubscribe = () => {};

        if (step === 'chat' && sessionId && !isOfflineMode) {
            try {
                unsubscribe = db.collection('support_sessions')
                    .doc(sessionId)
                    .collection('messages')
                    .orderBy('timestamp', 'asc')
                    .onSnapshot(snapshot => {
                        const msgs: Message[] = snapshot.docs.map(doc => ({
                            id: doc.id,
                            text: doc.data().text,
                            sender: doc.data().sender,
                            timestamp: doc.data().timestamp
                        }));
                        setMessages(msgs);
                    }, (err) => {
                        console.error("Firestore listener error:", err);
                        // If listener fails (e.g. rules changed), revert to offline mode
                        setIsOfflineMode(true);
                    });
            } catch (e) {
                console.error("Error setting up listener:", e);
                setIsOfflineMode(true);
            }
        }
        return () => unsubscribe();
    }, [step, sessionId, isOfflineMode]);

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!fullName.trim() || !employeeId.trim()) {
            setError("Please fill in all fields.");
            return;
        }

        setIsSending(true);
        
        const startOfflineSession = () => {
             const offlineId = `OFFLINE-${Date.now()}`;
             setSessionId(offlineId);
             setIsOfflineMode(true);
             setStep('chat');
             // Send notification (fire and forget)
             sendEmailToAdmin(`New Chat Session (Email Mode)`, 
                `User: ${fullName} (${employeeId})\nSession: ${offlineId}\n\nDatabase connection failed. Falling back to email mode.`);
        };

        try {
            // Attempt to create a new session in Firestore with a timeout
            // If the database is unreachable or rules deny access, this Promise should fail or timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Database connection timeout")), 5000)
            );

            const dbOperation = db.collection('support_sessions').add({
                fullName,
                employeeId,
                status: 'open',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: 'Session Started'
            });

            const sessionRef = await Promise.race([dbOperation, timeoutPromise]) as any;

            setSessionId(sessionRef.id);
            setIsOfflineMode(false);
            setStep('chat');
            
            // Send initial notification
            sendEmailToAdmin(`New Chat Session Started`, `
                User: ${fullName}
                ID: ${employeeId}
                Session ID: ${sessionRef.id}
                
                Please reply to this thread to communicate (Integration required) or use the admin dashboard.
            `);

        } catch (error: any) {
            console.error("Error starting chat, switching to offline mode:", error);
            startOfflineSession();
        } finally {
            setIsSending(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim() || !sessionId) return;

        const textToSend = inputText;
        setInputText(''); // Optimistic clear

        // Optimistic UI update
        const newMessage: Message = {
            id: `temp-${Date.now()}`,
            text: textToSend,
            sender: 'user',
            timestamp: new Date()
        };
        
        // If offline, we MUST manage state manually. 
        if (isOfflineMode) {
            setMessages(prev => [...prev, newMessage]);
        }

        try {
            // 1. Try Save to Firestore if online
            if (!isOfflineMode) {
                await db.collection('support_sessions').doc(sessionId).collection('messages').add({
                    text: textToSend,
                    sender: 'user',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                await db.collection('support_sessions').doc(sessionId).update({
                    lastMessage: textToSend,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // 2. Send Email to Admin (Always send email as requested)
            const subject = `[Need Help?] ${fullName} (${employeeId})`;
            const body = `
Message from ${fullName} (ID: ${employeeId}):

"${textToSend}"

---------------------------------------------------
Session ID: ${sessionId}
${isOfflineMode ? '(OFFLINE MODE - Reply via Email directly)' : 'To reply to the user, the message must be added to the Firestore database under this session ID.'}
            `;

            await sendEmailToAdmin(subject, body);

        } catch (error) {
            console.error("Error sending message:", error);
            // If DB fails mid-chat, switch to offline mode for future messages
            if (!isOfflineMode) {
                setIsOfflineMode(true);
                // Ensure the failed message is added locally so it's not lost in UI
                setMessages(prev => {
                    if (prev.some(m => m.text === textToSend && m.timestamp === newMessage.timestamp)) return prev;
                    return [...prev, newMessage];
                });
            }
        }
    };

    const sendEmailToAdmin = async (subject: string, message: string) => {
        try {
            await fetch("/api/sendEmail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    to: "hasibulhaque.info@gmail.com", 
                    subject: subject, 
                    message: message,
                }),
            });
        } catch (error) {
            console.error("Failed to route email:", error);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
            
            {/* Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto mb-4 w-[350px] sm:w-[380px] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-slide-in-up origin-bottom-right max-h-[600px]">
                    
                    {/* Header */}
                    <div className="bg-indigo-600 p-4 flex justify-between items-center shrink-0">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-white text-lg">Need Help?</h3>
                            <span className="text-indigo-200 text-xs flex items-center gap-1">
                                {isOfflineMode ? (
                                    <span className="text-yellow-300 font-bold bg-white/10 px-1.5 rounded">Email Support Mode</span>
                                ) : (
                                    "Live Support & Email Routing"
                                )}
                            </span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-grow bg-slate-950 flex flex-col h-[400px]">
                        
                        {step === 'form' ? (
                            <div className="p-6 flex flex-col justify-center h-full space-y-4">
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-700">
                                        <UserIcon className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <p className="text-slate-300 text-sm">Please introduce yourself to start chatting.</p>
                                </div>
                                
                                <form onSubmit={handleStartChat} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee ID</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={employeeId}
                                            onChange={e => setEmployeeId(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
                                            placeholder="e.g., EMP-1234"
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isSending}
                                        className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                    >
                                        {isSending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Connecting...
                                            </>
                                        ) : 'Start Chat'}
                                    </button>
                                    
                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2 animate-fade-in">
                                            <p className="text-red-400 text-xs text-center font-medium">{error}</p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        ) : (
                            <>
                                {/* Message List */}
                                <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    <div className="text-center py-4">
                                        <p className="text-xs text-slate-500">Session Started • {fullName} ({employeeId})</p>
                                        {isOfflineMode && (
                                            <p className="text-[10px] text-yellow-500/80 mt-1 bg-yellow-500/10 inline-block px-2 py-1 rounded">
                                                Database unavailable. Chatting via Email Mode.
                                            </p>
                                        )}
                                    </div>
                                    
                                    {messages.map((msg, idx) => (
                                        <div key={msg.id || idx} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div 
                                                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                    msg.sender === 'user' 
                                                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md' 
                                                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                                }`}
                                            >
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={inputText}
                                            onChange={e => setInputText(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-grow bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none text-sm placeholder-slate-600"
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!inputText.trim()}
                                            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 transition-all active:scale-95 shadow-lg"
                                        >
                                            <PaperAirplaneIcon className="w-5 h-5 transform -rotate-45 translate-x-[-2px] translate-y-[1px]" />
                                        </button>
                                    </form>
                                    <p className="text-[10px] text-center text-slate-600 mt-2">
                                        Messages are sent to support email immediately.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all transform hover:scale-110 active:scale-95 group relative"
                aria-label="Toggle Support Chat"
            >
                {/* Notification Dot (Optional visual flair) */}
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                
                {isOpen ? (
                    <CloseIcon className="w-7 h-7" />
                ) : (
                    <ChatBubbleIcon className="w-7 h-7" />
                )}
            </button>
        </div>
    );
};

export default ChatSupportWidget;
