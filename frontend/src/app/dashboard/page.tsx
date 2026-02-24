'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
            {/* Top Navigation */}
            <nav className="border-b border-border/50 px-8 py-4 flex justify-between items-center bg-card/30 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-2xl font-black tracking-tight">
                        Fam<span className="text-primary italic">Sacco</span>
                    </Link>
                    <div className="hidden md:flex gap-6 text-sm font-semibold text-foreground/60">
                        <Link href="/dashboard" className="text-primary">Overview</Link>
                        <Link href="/loans" className="hover:text-primary transition-colors">My Loans</Link>
                        <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
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
                        className="w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-all text-xl"
                    >
                        👤
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
                {/* Headline */}
                <section className="space-y-2 font-inter">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 rounded-full premium-gradient"></div>
                        <h1 className="text-4xl font-black tracking-tight">
                            Welcome back, {user.firstName}
                        </h1>
                    </div>
                    <p className="text-foreground/40 font-medium text-base pl-5">
                        Your FamSacco financial snapshot — live from the ledger.
                    </p>
                </section>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
                    {/* Savings Card */}
                    <div className="p-10 rounded-[2.5rem] premium-gradient text-white space-y-6 shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <span className="text-white/70 text-xs font-black uppercase tracking-[0.2em]">My Total Savings</span>
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">💰</div>
                        </div>
                        <div className="text-5xl font-black tracking-tighter relative z-10">
                            KES {(personalStats?.totalSavings || 0).toLocaleString()}
                        </div>
                        {personalStats?.loanProgress && (
                            <div className="pt-2 space-y-2 relative z-10">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                                    <span>Loan Repayment Progress</span>
                                    <span>{personalStats.loanProgress.percent.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${personalStats.loanProgress.percent}%` }}></div>
                                </div>
                                <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                    Debt-to-Equity: {personalStats.totalSavings > 0 ? ((personalStats.loanProgress.totalPayable / personalStats.totalSavings) * 100).toFixed(0) : '—'}%
                                </div>
                            </div>
                        )}
                        {!personalStats?.loanProgress && (
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm"></div>)}
                                </div>
                                <span className="text-xs font-bold text-white/80">Ledger Verified</span>
                            </div>
                        )}
                        <button
                            onClick={async () => {
                                const token = localStorage.getItem('access_token');
                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/reports/statement`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                    const blob = await res.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `my_statement_${new Date().toISOString().split('T')[0]}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                }
                            }}
                            className="w-full py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                        >
                            <span>📥</span> Get My Statement
                        </button>
                    </div>

                    {/* Active Loan Card */}
                    <div className="p-10 rounded-[2.5rem] glass-morphism border border-foreground/10 space-y-6 hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-start">
                            <span className="text-foreground/40 text-xs font-black uppercase tracking-[0.2em]">My Active Loan</span>
                            <div className="w-12 h-12 rounded-2xl accent-gradient flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">🏦</div>
                        </div>
                        <div className="text-5xl font-black tracking-tighter">
                            KES {(personalStats?.activeLoans || 0).toLocaleString()}
                        </div>
                        <div>
                            <Link href="/loans" className="px-6 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary transition-all hover:text-white inline-block">
                                {(personalStats?.activeLoans || 0) > 0 ? 'Manage Loan →' : 'Apply for Loan →'}
                            </Link>
                        </div>
                    </div>

                    {/* Family Pool Card */}
                    <div className="p-10 rounded-[2.5rem] glass-morphism border border-foreground/10 space-y-6 hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-start">
                            <span className="text-foreground/40 text-xs font-black uppercase tracking-[0.2em]">Family Wealth Pool</span>
                            <div className="w-12 h-12 rounded-2xl savings-gradient flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">🌍</div>
                        </div>
                        <div className="text-5xl font-black tracking-tighter">
                            KES 0.00
                        </div>
                        <div className="text-foreground/40 text-xs font-black uppercase tracking-widest">
                            Next cycle: Mar 2026
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    <div className="glass-morphism rounded-3xl p-8 border border-border/50 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black tracking-tight">Recent Transactions</h3>
                            <Link href="/finance" className="text-xs font-bold text-primary hover:underline uppercase tracking-tight">View All</Link>
                        </div>
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="text-4xl opacity-20">📭</div>
                            <p className="text-foreground/40 font-medium text-sm">No transactions yet. Start by sending your first contribution.</p>
                            <Link href="/finance" className="px-6 py-2 rounded-xl accent-gradient text-white font-bold text-sm shadow-lg shadow-primary/20">
                                Deposit Wealth
                            </Link>
                        </div>
                    </div>

                    <div className="glass-morphism rounded-3xl p-8 border border-border/50 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black tracking-tight">Family Updates</h3>
                            <Link href="/social" className="text-xs font-bold text-primary hover:underline uppercase tracking-tight">Post Update</Link>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {posts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                    <div className="text-4xl opacity-20">💡</div>
                                    <p className="text-sm text-foreground/40 font-medium">Welcome to FamSacco! No family updates yet.</p>
                                </div>
                            ) : posts.slice(0, 5).map(post => (
                                <div key={post.id} className={`p-4 rounded-2xl border transition-all ${post.content.startsWith('🚨 BROADCAST') ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5' : 'bg-foreground/5 border-foreground/5'}`}>
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg ${post.content.startsWith('🚨 BROADCAST') ? 'premium-gradient' : 'bg-foreground/10'}`}>
                                            {post.content.startsWith('🚨 BROADCAST') ? '📢' : '💭'}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center gap-2">
                                                <p className="text-xs font-black uppercase tracking-tight text-foreground/60">{post.user.firstName} {post.user.lastName}</p>
                                                <span className="text-[10px] font-medium text-foreground/30">{new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-bold leading-relaxed">{post.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
