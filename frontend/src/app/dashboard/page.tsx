'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const fmt = (v: number) => `KES ${Number(v || 0).toLocaleString()}`;

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [personalStats, setPersonalStats] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');

        if (!storedUser || !token) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        const roles: string[] = parsedUser.roles || [];

        // Role-based portal routing — officials get their dedicated command centres
        if (roles.includes('super_admin') || roles.includes('chairperson')) {
            router.push('/chairperson');
            return;
        }
        if (roles.includes('treasurer')) {
            router.push('/treasurer');
            return;
        }
        if (roles.includes('secretary')) {
            router.push('/secretary');
            return;
        }

        // Regular members see personal stats
        fetchData(token);
    }, [router]);

    const fetchData = async (token: string) => {
        try {
            const [statsRes, postsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/ledger/my-stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/social/posts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (statsRes.ok) setPersonalStats(await statsRes.json());
            if (postsRes.ok) setPosts(await postsRes.json());
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        }
    };

    if (!mounted || !user) return null;

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Floating Navigation */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-6">
                <nav className="glass-morphism rounded-full px-8 py-4 flex justify-between items-center bg-white/60 shadow-2xl border border-primary/5">
                    <div className="flex items-center gap-12">
                        <Link href="/dashboard" className="text-2xl font-black tracking-tight hover:scale-105 transition-transform">
                            Fam<span className="text-primary italic">Sacco</span>
                        </Link>
                        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">
                            <Link href="/dashboard" className="text-primary">Overview</Link>
                            <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                            <Link href="/loans" className="hover:text-primary transition-colors">Loans</Link>
                            <Link href="/social" className="hover:text-primary transition-colors">Social</Link>
                            {user.roles?.some((r: string) => ['committee'].includes(r)) && (
                                <Link href="/committee/governance" className="hover:text-primary transition-colors">Governance</Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold">{user.firstName} {user.lastName}</div>
                            <div className="text-xs text-foreground/40 font-medium capitalize">Member Account</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-all text-xl hover-lift"
                        >
                            👤
                        </button>
                    </div>
                </nav>
            </div>

            <div className="h-24"></div> {/* Spacer for fixed nav */}

            {/* Main Content */}
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-10 animate-reveal">
                {/* Headline */}
                <section className="space-y-6 animate-reveal">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                                Hello, {user.firstName}
                            </h1>
                            <p className="text-lg text-foreground/40 font-medium">Your family wealth snapshot.</p>
                        </div>
                        <div className="glass-morphism rounded-3xl p-6 bg-secondary/5 border-secondary/20 max-w-sm hover-lift">
                            <p className="text-xs text-foreground/60 leading-relaxed font-semibold">
                                💡 Tip: Increasing your monthly savings by <span className="text-secondary">KES 500</span> boosts your loan limit!
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'My Savings', value: fmt(personalStats?.totalSavings), icon: '💰', gradient: 'premium-gradient text-white', delay: '0ms' },
                        { label: 'Active Loans', value: fmt(personalStats?.activeLoans), icon: '📉', gradient: 'bg-white border border-primary/10', color: 'text-primary', delay: '100ms' },
                        { label: 'Current Dividends', value: 'KES 0.00', icon: '✨', gradient: 'bg-white border border-secondary/20', color: 'text-secondary', delay: '200ms' },
                        { label: 'Family Status', value: user.status === 'PENDING' ? 'Restricted' : 'Verified', icon: '🛡️', gradient: 'gold-gradient text-white', delay: '300ms' },
                    ].map((card, i) => (
                        <div key={card.label} className={`rounded-[2.5rem] p-8 space-y-3 shadow-sm hover-lift ${card.gradient}`} style={{ animationDelay: card.delay, animationFillMode: 'forwards' }}>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{card.label}</span>
                                <span className="text-2xl">{card.icon}</span>
                            </div>
                            <div className={`text-2xl font-black tracking-tighter ${card.color ?? 'text-white'}`}>{card.value}</div>
                        </div>
                    ))}
                </div>

                {/* Content Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-inter">
                    {/* Social Wall Column */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex justify-between items-end px-2">
                            <h3 className="text-2xl font-black tracking-tighter">Family Wall</h3>
                            <Link href="/social" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline">All Updates →</Link>
                        </div>
                        <div className="space-y-4">
                            {posts.length === 0 ? (
                                <div className="glass-morphism rounded-[3rem] p-16 text-center border border-dashed border-primary/10">
                                    <div className="text-5xl opacity-10 mb-4">🏠</div>
                                    <p className="text-foreground/40 font-bold">The family wall is quiet today.</p>
                                </div>
                            ) : posts.slice(0, 3).map((post, i) => (
                                <div key={post.id} className="glass-morphism rounded-[2.5rem] p-8 hover-lift animate-reveal" style={{ animationDelay: `${i * 150}ms` }}>
                                    <div className="flex gap-5">
                                        <div className="w-12 h-12 rounded-2xl gold-gradient shadow-lg flex-shrink-0 flex items-center justify-center text-white font-black">
                                            {post.user.firstName[0]}
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <div className="flex justify-between items-start">
                                                <div className="font-black text-sm">{post.user.firstName} {post.user.lastName}</div>
                                                <div className="text-[9px] text-foreground/30 font-black uppercase tracking-widest">Just now</div>
                                            </div>
                                            <p className="text-foreground/60 text-sm leading-relaxed font-medium">{post.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Panel Column */}
                    <div className="md:col-span-1 space-y-8">
                        <div className="glass-morphism rounded-[3rem] p-10 space-y-8 hover-lift border-secondary/20 bg-white/40">
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter mb-2">My Actions</h3>
                                <p className="text-xs text-foreground/40 font-medium tracking-tight">Manage your family wealth.</p>
                            </div>
                            <div className="space-y-3">
                                <button onClick={() => router.push('/loans')} className="w-full py-5 rounded-2xl premium-gradient text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                                    💸 Borrow Wealth
                                </button>
                                <button onClick={() => router.push('/finance')} className="w-full py-5 rounded-2xl bg-white border border-primary/5 font-black text-xs uppercase tracking-widest hover:bg-foreground/5 transition-all">
                                    📥 View Ledger
                                </button>
                            </div>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-secondary/5 border border-secondary/10 space-y-4 relative overflow-hidden group hover-lift">
                            <div className="absolute top-0 right-0 p-6 text-4xl opacity-5 group-hover:scale-110 transition-transform">💡</div>
                            <h3 className="text-lg font-black tracking-tighter">Growth Tip</h3>
                            <p className="text-sm text-foreground/50 leading-relaxed font-medium">
                                Active lenders in the family pool earn a <span className="text-secondary font-black">proportional dividend</span> share every quarter. Keep your pool active!
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
