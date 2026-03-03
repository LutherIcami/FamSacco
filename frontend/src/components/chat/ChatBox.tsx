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
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
            const socketUrl = apiUrl.replace('/api', '');

            // Initialize socket
            const socket = io(socketUrl, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
            });

            socket.on('connect', () => console.log('Chat connected'));
            socket.on('connect_error', (err) => console.error('Chat connection error:', err));

            socket.on('receive_message', (msg: Message) => {
                setMessages(prev => {
                    // Check if we already have this message (deduplication)
                    if (prev.some(m => m.id === msg.id)) return prev;

                    // If we have an optimistic message with the same content and user, replace it
                    // or just append if it's from someone else
                    const isDuplicate = prev.some(m =>
                        m.id.startsWith('temp-') &&
                        m.content === msg.content &&
                        m.user.id === msg.user.id
                    );

                    if (isDuplicate) {
                        return prev.map(m => (m.id.startsWith('temp-') && m.content === msg.content) ? msg : m);
                    }

                    return [...prev, msg];
                });
            });

            socketRef.current = socket;

            // Initial fetch of recent messages
            fetch(`${apiUrl}/chat/recent`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data)) setMessages(data);
                })
                .catch(err => console.error('Initial chat load failed', err));

            return () => {
                socket.disconnect();
            };
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current && isOpen) {
            const scrollContainer = scrollRef.current;
            scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !socketRef.current || !currentUser) return;

        const msgContent = content.trim();
        const tempId = `temp-${Date.now()}`;

        // Optimistic Update
        const optimisticMsg: Message = {
            id: tempId,
            content: msgContent,
            createdAt: new Date().toISOString(),
            user: currentUser
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setContent('');

        // Send to server
        socketRef.current.emit('send_message', { content: msgContent });
    };

    if (!hasToken) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[100] font-inter">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 rounded-full premium-gradient shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all text-white border-4 border-white/20 animate-bounce-slow"
                >
                    💬
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[380px] h-[550px] bg-white/95 backdrop-blur-2xl border border-primary/10 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-reveal">
                    {/* Header */}
                    <div className="px-8 py-6 premium-gradient text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">🏠</div>
                            <div>
                                <h3 className="text-base font-black tracking-tight">Family Lounge</h3>
                                <div className="flex items-center gap-1.5 pt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 anim-pulse"></span>
                                    <p className="text-[9px] font-black opacity-70 uppercase tracking-widest leading-none">Live Connection</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div
                        className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide"
                        ref={scrollRef}
                    >
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                                <span className="text-6xl">✨</span>
                                <p className="text-xs font-black uppercase tracking-[0.2em]">The room is quiet...</p>
                            </div>
                        ) : messages.map((msg, i) => {
                            const isMe = msg.user.id === currentUser?.id;
                            const isTemp = msg.id.startsWith('temp-');

                            // Grouping logic (simplified)
                            const prevMsg = messages[i - 1];
                            const isSameUser = prevMsg?.user.id === msg.user.id;

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameUser ? '-mt-4' : ''} animate-reveal`}
                                >
                                    {!isSameUser && (
                                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1.5 px-1">
                                            {isMe ? 'You' : `${msg.user.firstName} ${msg.user.lastName}`}
                                        </span>
                                    )}
                                    <div
                                        className={`max-w-[80%] px-5 py-3.5 rounded-[24px] text-[13px] font-medium leading-relaxed shadow-sm transition-all ${isMe
                                            ? 'bg-primary text-white rounded-tr-none shadow-primary/10'
                                            : 'bg-foreground/5 text-foreground rounded-tl-none'
                                            } ${isTemp ? 'opacity-50 scale-95 origin-right translate-y-1' : 'opacity-100 scale-100'}`}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[8px] font-black text-foreground/10 mt-1 uppercase tracking-widest">
                                        {isTemp ? 'Sending...' : new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSend}
                        className="p-6 border-t border-foreground/[0.03] bg-white shrink-0"
                    >
                        <div className="flex gap-3 bg-foreground/5 p-2 rounded-[24px] border border-foreground/[0.03] focus-within:border-primary/20 focus-within:bg-white transition-all shadow-inner">
                            <input
                                type="text"
                                placeholder="Whisper something..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="flex-1 bg-transparent px-4 py-2 text-sm font-medium outline-none placeholder:text-foreground/20"
                            />
                            <button
                                type="submit"
                                disabled={!content.trim() || isLoading}
                                className="w-10 h-10 rounded-2xl premium-gradient text-white flex items-center justify-center shadow-xl shadow-primary/10 hover:scale-105 active:scale-95 transition-all disabled:grayscale disabled:opacity-20"
                            >
                                <span className="rotate-45 -mt-0.5 -ml-0.5 text-lg">✈️</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
