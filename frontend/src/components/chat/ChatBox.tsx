'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        roles: { role: { name: string } }[];
    }
}

export default function ChatBox() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [hasToken, setHasToken] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const u = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        if (u) setCurrentUser(JSON.parse(u));
        setHasToken(!!token);

        if (token) {
            // Initialize socket
            const socket = io(process.env.NEXT_PUBLIC_API_URL!.replace('/api', ''), {
                auth: { token },
                transports: ['websocket']
            });

            socket.on('receive_message', (msg: Message) => {
                setMessages(prev => [...prev, msg]);
            });

            socketRef.current = socket;

            // Initial fetch of recent messages
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/recent`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(data => setMessages(data))
                .catch(err => console.error('Initial chat load failed', err));

            return () => {
                socket.disconnect();
            };
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !socketRef.current) return;

        const msgContent = content.trim();
        setContent('');

        socketRef.current.emit('send_message', { content: msgContent });
    };

    if (!hasToken) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[100] font-inter">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 rounded-full premium-gradient shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all text-white border-4 border-white/20"
                >
                    💬
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] h-[500px] bg-card/60 backdrop-blur-3xl border border-white/20 rounded-[32px] shadow-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                    {/* Header */}
                    <div className="px-6 py-5 premium-gradient text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🤝</span>
                            <div>
                                <h3 className="text-sm font-black tracking-tight">Family Lounge</h3>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Global Chat</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div
                        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
                        ref={scrollRef}
                    >
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                                <span className="text-4xl">👋</span>
                                <p className="text-xs font-bold uppercase tracking-widest">Start the family conversation!</p>
                            </div>
                        ) : messages.map((msg) => {
                            const isMe = msg.user.id === currentUser?.id;
                            const isOfficial = msg.user.roles.some(r => ['secretary', 'treasurer', 'super_admin'].includes(r.role.name));

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[10px] font-black text-foreground/40 uppercase tracking-tight">
                                            {isMe ? 'Me' : `${msg.user.firstName} ${msg.user.lastName}`}
                                        </span>
                                        {isOfficial && !isMe && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase">Official</span>
                                        )}
                                    </div>
                                    <div
                                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${isMe
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : isOfficial
                                                ? 'bg-primary/10 text-foreground border border-primary/20 rounded-tl-none font-bold'
                                                : 'bg-foreground/5 text-foreground rounded-tl-none'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[9px] text-foreground/20 mt-1">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSend}
                        className="p-5 border-t border-foreground/5 shrink-0"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Share something with the family..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-primary/50 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!content.trim() || isLoading}
                                className="w-10 h-10 rounded-xl premium-gradient text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <span className="rotate-45 -mt-0.5 -ml-0.5">✈️</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
