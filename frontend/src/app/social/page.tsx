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
        'from-violet-500 to-purple-600',
        'from-cyan-500 to-blue-600',
        'from-emerald-500 to-green-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-500',
        'from-indigo-500 to-blue-600',
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
            {/* Nav */}
            <nav className="border-b border-border/50 px-8 py-4 flex justify-between items-center bg-card/30 backdrop-blur-xl sticky top-0 z-50">
                <Link href="/dashboard" className="text-2xl font-black tracking-tight">
                    Fam<span className="text-primary italic">Sacco</span>
                </Link>
                <div className="flex gap-6 text-sm font-semibold text-foreground/60">
                    <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                    <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                    <Link href="/loans" className="hover:text-primary transition-colors">Loans</Link>
                    <Link href="/social" className="text-primary transition-colors">Social</Link>
                </div>
            </nav>

            <main className="p-8 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
                {/* Hero */}
                <section className="text-center space-y-2">
                    <h1 className="text-5xl font-black tracking-tight">Family Wall 🏠</h1>
                    <p className="text-foreground/40 text-lg font-medium">
                        Stay connected with the family&apos;s progress and achievements.
                    </p>
                </section>

                {/* Error banner */}
                {error && (
                    <div className="px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex justify-between items-center">
                        <span>⚠ {error}</span>
                        <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-400">✕</button>
                    </div>
                )}

                {/* Compose Box */}
                <div className="glass-morphism rounded-3xl p-6 border border-foreground/10 shadow-2xl space-y-4">
                    <div className="flex gap-4">
                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor(user.id)} flex items-center justify-center text-white font-black text-sm shadow-lg flex-shrink-0`}>
                            {user.firstName[0]}{user.lastName?.[0] ?? ''}
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={newPostContent}
                            onChange={autoResize}
                            placeholder={`What's happening in the family, ${user.firstName}?`}
                            className="w-full bg-transparent border-none outline-none resize-none pt-2 text-base placeholder:text-foreground/20 leading-relaxed"
                            rows={3}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost();
                            }}
                        />
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-foreground/5">
                        <p className="text-xs text-foreground/30 font-medium">⌘ + Enter to post</p>
                        <button
                            onClick={handlePost}
                            disabled={posting || !newPostContent.trim()}
                            className="px-8 py-3 rounded-xl accent-gradient text-white font-black text-sm shadow-xl shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            {posting ? 'Sharing…' : 'Share Update'}
                        </button>
                    </div>
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-morphism rounded-3xl p-6 border border-foreground/10 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-11 h-11 rounded-full bg-foreground/10" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-3 bg-foreground/10 rounded-full w-1/4" />
                                        <div className="h-3 bg-foreground/10 rounded-full w-2/3" />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="h-4 bg-foreground/10 rounded-full w-full" />
                                    <div className="h-4 bg-foreground/10 rounded-full w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="glass-morphism rounded-3xl p-16 border border-foreground/10 text-center space-y-3">
                        <div className="text-5xl">💬</div>
                        <div className="font-black text-lg">No posts yet</div>
                        <div className="text-foreground/40 text-sm">Be the first to share a family update!</div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {posts.map(post => (
                            <article key={post.id} className="glass-morphism rounded-3xl border border-foreground/10 overflow-hidden transition-all duration-200 hover:border-foreground/20">
                                {/* Post header */}
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3 items-center">
                                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor(post.user.id)} flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0`}>
                                                {initials(post.user)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">
                                                    {post.user.firstName} {post.user.lastName}
                                                </div>
                                                <div className="text-xs text-foreground/40 font-medium">
                                                    {timeAgo(post.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        {post.user.id === user.id && (
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="text-foreground/20 hover:text-red-400 transition-colors text-lg leading-none p-1"
                                                title="Delete post"
                                            >
                                                🗑
                                            </button>
                                        )}
                                    </div>

                                    {/* Post content */}
                                    <p className="text-foreground/80 leading-relaxed">{post.content}</p>

                                    {/* Post image if any */}
                                    {post.imageUrl && (
                                        <img src={post.imageUrl} alt="Post" className="w-full rounded-2xl object-cover max-h-80" />
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-4 pt-2 border-t border-foreground/5">
                                        <button
                                            onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40 hover:text-primary transition-colors"
                                        >
                                            <span>💬</span>
                                            <span>{post._count.comments} {post._count.comments === 1 ? 'Comment' : 'Comments'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Comments section */}
                                {expandedPost === post.id && (
                                    <div className="border-t border-foreground/5 bg-foreground/[0.02] px-6 pb-6 pt-4 space-y-4">
                                        {/* Existing comments */}
                                        {post.comments.length > 0 && (
                                            <div className="space-y-3">
                                                {post.comments.map(comment => (
                                                    <div key={comment.id} className="flex gap-3 items-start group">
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(comment.user.id)} flex items-center justify-center text-white font-black text-xs flex-shrink-0`}>
                                                            {initials(comment.user)}
                                                        </div>
                                                        <div className="flex-1 bg-foreground/5 rounded-2xl px-4 py-3">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-xs font-bold text-foreground/70">
                                                                    {comment.user.firstName} {comment.user.lastName}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-foreground/30">
                                                                        {timeAgo(comment.createdAt)}
                                                                    </span>
                                                                    {comment.user.id === user.id && (
                                                                        <button
                                                                            onClick={() => handleDeleteComment(post.id, comment.id)}
                                                                            className="opacity-0 group-hover:opacity-100 text-foreground/20 hover:text-red-400 transition-all text-sm"
                                                                            title="Delete comment"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-foreground/70 mt-1">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add comment */}
                                        <div className="flex gap-3 items-center">
                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(user.id)} flex items-center justify-center text-white font-black text-xs flex-shrink-0`}>
                                                {user.firstName[0]}{user.lastName?.[0] ?? ''}
                                            </div>
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={commentDrafts[post.id] ?? ''}
                                                    onChange={e => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                    placeholder="Write a comment…"
                                                    className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/40 transition-colors placeholder:text-foreground/20"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleAddComment(post.id);
                                                    }}
                                                    disabled={submittingComment === post.id}
                                                />
                                                <button
                                                    onClick={() => handleAddComment(post.id)}
                                                    disabled={submittingComment === post.id || !commentDrafts[post.id]?.trim()}
                                                    className="px-4 py-2 rounded-xl accent-gradient text-white font-black text-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
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
