import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function GenyChatbot({ courseId }) {
    const { getAuthHeaders } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([
        { role: 'assistant', content: "Hello! I'm Geny, your AI learning assistant. Ask me anything about your course!" }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [history, isOpen]);

    // Fetch history when courseId changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (!courseId) return;
            try {
                const res = await fetch(`${API_BASE}/chat/history/${courseId}`, {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setHistory(data);
                    } else {
                        setHistory([
                            { role: 'assistant', content: "Hello! I'm Geny, your AI learning assistant. Ask me anything about your course!" }
                        ]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch chat history:", err);
            }
        };

        fetchHistory();
    }, [courseId]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!message.trim() || loading) return;

        const userMsg = message.trim();
        setMessage('');
        setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/chat/ask`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMsg,
                    course_id: courseId
                })
            });

            if (!res.ok) throw new Error("Failed to get response");

            const data = await res.json();
            setHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (err) {
            console.error(err);
            setHistory(prev => [...prev, { role: 'assistant', content: "I’m having trouble right now. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto w-[380px] h-[550px] bg-neutral-900 border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up origin-bottom-right max-sm:w-[calc(100vw-2rem)] max-sm:h-[calc(80vh)]">
                    {/* Header */}
                    <div className="p-6 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-black font-black leading-tight">Geny</h4>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Online Expert</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors text-black">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0A0A0A] custom-scrollbar">
                        {history.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-neutral-800 border-white/10' : 'bg-white border-transparent'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4 text-neutral-400" /> : <Sparkles className="w-4 h-4 text-black" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-neutral-800 text-white rounded-tr-none' : 'bg-neutral-900 border border-white/5 text-slate-300 rounded-tl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-white">
                                        <Sparkles className="w-4 h-4 text-black" />
                                    </div>
                                    <div className="p-4 rounded-2xl text-sm bg-neutral-900 border border-white/5 text-slate-300 rounded-tl-none flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 bg-neutral-900 border-t border-white/5">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Solve your doubts..."
                                disabled={loading}
                                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading || !message.trim()}
                                className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:scale-[1.05] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto w-16 h-16 bg-white text-black rounded-2xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center hover:scale-[1.05] transition-all active:scale-[0.95] group relative overflow-hidden"
            >
                {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
                <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>
        </div>
    );
}
