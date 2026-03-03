'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Author {
    id: string;
    firstName: string;
    lastName: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: Author;
}

interface Post {
    id: string;
    content: string;
    imageUrl?: string;
    createdAt: string;
    user: Author;
    comments: Comment[];
    _count: { comments: number };
}

function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function initials(u: Author) {
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
}

function avatarColor(id: string) {
    const colors = [
        'from-[#002366] to-[#0047AB]', // Royal Blue variants
        'from-[#FFD700] to-[#DAA520]', // Gold variants
        'from-[#0047AB] to-[#4169E1]', // Lighter Blue variants
        'from-[#B8860B] to-[#DAA520]', // Darker Gold variants
        'from-[#001F3F] to-[#0041B2]', // Deep Navy to Royal variants
        'from-[#C5A022] to-[#FFD700]', // Metallic Gold variants
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
}

export default function SocialPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string>('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [expandedPost, setExpandedPost] = useState<string | null>(null);
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [submittingComment, setSubmittingComment] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('access_token');
        if (!storedUser || !storedToken) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
    }, [router]);

    useEffect(() => {
        if (!token) return;
        fetchPosts();
    }, [token]);

    async function fetchPosts() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/social/posts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load posts');
            const data = await res.json();
            setPosts(data);
        } catch (e: any) {
            setError(e.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    async function handlePost() {
        if (!newPostContent.trim()) return;
        setPosting(true);
        try {
            const res = await fetch(`${API}/social/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: newPostContent.trim() })
            });
            if (!res.ok) throw new Error('Failed to post');
            const created: Post = await res.json();
            setPosts(prev => [created, ...prev]);
            setNewPostContent('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch (e: any) {
            setError(e.message);
        } finally {
            setPosting(false);
        }
    }

    async function handleDeletePost(postId: string) {
        try {
            await fetch(`${API}/social/posts/${postId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (e: any) {
            setError(e.message);
        }
    }

    async function handleAddComment(postId: string) {
        const content = commentDrafts[postId]?.trim();
        if (!content) return;
        setSubmittingComment(postId);
        try {
            const res = await fetch(`${API}/social/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            if (!res.ok) throw new Error('Failed to comment');
            const comment: Comment = await res.json();
            setPosts(prev => prev.map(p => {
                if (p.id !== postId) return p;
                return {
                    ...p,
                    comments: [...p.comments, comment],
                    _count: { comments: p._count.comments + 1 }
                };
            }));
            setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmittingComment(null);
        }
    }

    async function handleDeleteComment(postId: string, commentId: string) {
        try {
            await fetch(`${API}/social/comments/${commentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(prev => prev.map(p => {
                if (p.id !== postId) return p;
                return {
                    ...p,
                    comments: p.comments.filter(c => c.id !== commentId),
                    _count: { comments: p._count.comments - 1 }
                };
            }));
        } catch (e: any) {
            setError(e.message);
        }
    }

    function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setNewPostContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col font-inter">
            {/* Floating Navigation */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-6">
                <nav className="glass-morphism rounded-full px-8 py-4 flex justify-between items-center bg-white/60 shadow-2xl border border-primary/5">
                    <div className="flex items-center gap-12">
                        <Link href="/dashboard" className="text-2xl font-black tracking-tight hover:scale-105 transition-transform">
                            Fam<span className="text-primary italic">Sacco</span>
                        </Link>
                        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">
                            <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                            <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                            <Link href="/loans" className="hover:text-primary transition-colors">Loans</Link>
                            <Link href="/social" className="text-primary">Social</Link>
                        </div>
                    </div>
                </nav>
            </div>

            <div className="h-24"></div>

            <main className="p-8 max-w-2xl mx-auto w-full space-y-12 animate-reveal">
                {/* Hero */}
                <section className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Family Wall</h1>
                    <p className="text-lg text-foreground/40 font-medium">The heartbeat of our shared success.</p>
                </section>

                {/* Error banner */}
                {error && (
                    <div className="px-6 py-4 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest flex justify-between items-center animate-shake">
                        <span>⚠ {error}</span>
                        <button onClick={() => setError('')} className="opacity-40 hover:opacity-100">✕</button>
                    </div>
                )}

                {/* Compose Box */}
                <div className="bg-white rounded-[3rem] p-8 border border-primary/5 shadow-2xl space-y-4 hover-lift">
                    <div className="flex gap-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColor(user.id)} flex items-center justify-center text-white font-black text-lg shadow-gold flex-shrink-0 transition-transform hover:rotate-12`}>
                            {user.firstName[0]}{user.lastName?.[0] ?? ''}
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={newPostContent}
                            onChange={autoResize}
                            placeholder={`What's on your mind, ${user.firstName}?`}
                            className="w-full bg-transparent border-none outline-none resize-none pt-3 text-lg placeholder:text-foreground/10 leading-snug font-medium tracking-tight"
                            rows={2}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost();
                            }}
                        />
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-foreground/5">
                        <p className="text-[10px] text-foreground/20 font-black uppercase tracking-[0.2em]">Press ⌘+Enter to share</p>
                        <button
                            onClick={handlePost}
                            disabled={posting || !newPostContent.trim()}
                            className="px-10 py-4 rounded-2xl premium-gradient text-white font-black text-xs uppercase tracking-widest shadow-gold disabled:opacity-20 transition-all hover:scale-[1.05] active:scale-95"
                        >
                            {posting ? 'Broadcasting…' : 'Share Update'}
                        </button>
                    </div>
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-[3rem] p-10 border border-primary/5 animate-pulse opacity-20">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-foreground/10" />
                                    <div className="flex-1 space-y-3 py-1">
                                        <div className="h-4 bg-foreground/10 rounded-full w-1/4" />
                                        <div className="h-4 bg-foreground/10 rounded-full w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="glass-morphism rounded-[3rem] p-24 border border-dashed border-primary/10 text-center space-y-4">
                        <div className="text-6xl opacity-10">🍃</div>
                        <h4 className="text-xl font-black tracking-tight text-foreground/30">Silent Wall</h4>
                        <p className="text-sm text-foreground/20 font-medium">Be the first to leave a mark today.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {posts.map((post, i) => (
                            <article key={post.id} className="bg-white rounded-[3rem] border border-primary/5 shadow-xl hover-lift animate-reveal overflow-hidden group" style={{ animationDelay: `${i * 100}ms` }}>
                                {/* Post header */}
                                <div className="p-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-5 items-center">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColor(post.user.id)} flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0 transition-transform group-hover:rotate-6`}>
                                                {initials(post.user)}
                                            </div>
                                            <div>
                                                <div className="font-black text-lg tracking-tight">
                                                    {post.user.firstName} {post.user.lastName}
                                                </div>
                                                <div className="text-[10px] text-foreground/30 font-black uppercase tracking-widest">
                                                    {timeAgo(post.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        {post.user.id === user.id && (
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="text-foreground/10 hover:text-red-400 transition-colors p-2 text-xl"
                                                title="Remove Post"
                                            >
                                                🗑
                                            </button>
                                        )}
                                    </div>

                                    {/* Post content */}
                                    <p className="text-xl text-foreground font-medium leading-relaxed tracking-tight">{post.content}</p>

                                    {/* Post image if any */}
                                    {post.imageUrl && (
                                        <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-primary/5">
                                            <img src={post.imageUrl} alt="Family Update" className="w-full object-cover max-h-[500px] hover:scale-105 transition-transform duration-700" />
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-8 pt-6 border-t border-foreground/5">
                                        <button
                                            onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 hover:text-primary transition-all group/btn"
                                        >
                                            <span className="text-lg group-hover/btn:scale-125 transition-transform">💬</span>
                                            <span>{post._count.comments} {post._count.comments === 1 ? 'Comment' : 'Comments'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Comments section */}
                                {expandedPost === post.id && (
                                    <div className="bg-foreground/[0.01] border-t border-foreground/5 p-10 space-y-8 animate-reveal">
                                        {/* Existing comments */}
                                        {post.comments.length > 0 && (
                                            <div className="space-y-6">
                                                {post.comments.map(comment => (
                                                    <div key={comment.id} className="flex gap-4 items-start group/comment">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor(comment.user.id)} flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-sm`}>
                                                            {initials(comment.user)}
                                                        </div>
                                                        <div className="flex-1 bg-white p-6 rounded-[1.5rem] shadow-sm border border-primary/5 relative">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-sm font-black tracking-tight">{comment.user.firstName} {comment.user.lastName}</span>
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">{timeAgo(comment.createdAt)}</span>
                                                            </div>
                                                            <p className="text-sm text-foreground/60 leading-relaxed font-medium">{comment.content}</p>
                                                            {comment.user.id === user.id && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                                                    className="absolute top-4 right-4 opacity-0 group-hover/comment:opacity-100 text-foreground/10 hover:text-red-400 transition-all"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add comment */}
                                        <div className="flex gap-4 items-center">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor(user.id)} flex items-center justify-center text-white font-black text-ts flex-shrink-0 shadow-gold`}>
                                                {user.firstName[0]}{user.lastName?.[0] ?? ''}
                                            </div>
                                            <div className="flex-1 flex gap-3">
                                                <input
                                                    type="text"
                                                    value={commentDrafts[post.id] ?? ''}
                                                    onChange={e => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                    placeholder="Add a family note…"
                                                    className="flex-1 bg-white border border-primary/5 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-primary/50 transition-all placeholder:text-foreground/10"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleAddComment(post.id);
                                                    }}
                                                    disabled={submittingComment === post.id}
                                                />
                                                <button
                                                    onClick={() => handleAddComment(post.id)}
                                                    disabled={submittingComment === post.id || !commentDrafts[post.id]?.trim()}
                                                    className="w-14 h-14 rounded-2xl accent-gradient text-white font-black flex items-center justify-center shadow-lg disabled:opacity-10 transition-transform hover:scale-105 active:scale-95"
                                                >
                                                    {submittingComment === post.id ? '…' : '→'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
