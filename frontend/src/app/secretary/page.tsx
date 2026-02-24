'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Member { userId: string; name: string; email: string; status: string; savings: number; activeLoan: { principal: number; status: string; progress: number } | null }
interface Stats { liquidity: number; portfolioAtRisk: number; totalIncome: number; awaitingDisbursement: number; awaitingGovernance: number; }
interface Tx { id: string; debit: number; credit: number; createdAt: string; account: { accountType: string; user: { firstName: string; lastName: string } | null } }

const fmt = (n: number) => `KES ${n.toLocaleString()}`;

export default function SecretaryDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [roster, setRoster] = useState<Member[]>([]);
    const [transactions, setTransactions] = useState<Tx[]>([]);
    const [search, setSearch] = useState('');

    const fetchAll = useCallback(async (token: string) => {
        const headers = { Authorization: `Bearer ${token}` };
        const base = process.env.NEXT_PUBLIC_API_URL;
        const [s, r, t] = await Promise.all([
            fetch(`${base}/finance/ledger/stats`, { headers }).then(r => r.ok ? r.json() : null),
            fetch(`${base}/finance/ledger/member-roster`, { headers }).then(r => r.ok ? r.json() : []),
            fetch(`${base}/finance/ledger/transactions`, { headers }).then(r => r.ok ? r.json() : []),
        ]);
        setStats(s); setRoster(r); setTransactions(t);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        if (!storedUser || !token) { router.push('/login'); return; }
        const u = JSON.parse(storedUser);
        if (!u.roles?.some((r: string) => ['secretary', 'super_admin'].includes(r))) { router.push('/dashboard'); return; }
        setUser(u);
        fetchAll(token);
    }, [router, fetchAll]);

    const filtered = roster.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    );

    const activeMembers = roster.filter(m => m.status === 'ACTIVE').length;
    const pendingMembers = roster.filter(m => m.status === 'PENDING').length;
    const membersWithLoans = roster.filter(m => m.activeLoan).length;
    const totalSavings = roster.reduce((s, m) => s + m.savings, 0);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background font-inter">
            {/* Nav */}
            <nav className="border-b border-border/50 px-8 py-4 flex justify-between items-center bg-card/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-2xl font-black tracking-tight">Fam<span className="text-primary italic">Sacco</span></Link>
                    <div className="hidden md:flex gap-6 text-sm font-semibold text-foreground/60">
                        <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                        <Link href="/secretary" className="text-primary">Secretariat</Link>
                        <Link href="/committee/governance" className="hover:text-primary transition-colors">Governance</Link>
                        <Link href="/social" className="hover:text-primary transition-colors">Social</Link>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">Secretary</span>
                    <span className="text-sm font-bold">{user.firstName} {user.lastName}</span>
                </div>
            </nav>

            <main className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <section>
                    <h1 className="text-4xl font-black tracking-tight">Secretariat Portal 📝</h1>
                    <p className="text-foreground/40 font-medium mt-1">Membership records, Sacco status, and activity feed — all in one view.</p>
                </section>

                {/* Membership Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                        { label: 'Active Members', value: activeMembers, icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                        { label: 'Pending Approval', value: pendingMembers, icon: '⏳', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                        { label: 'Members w/ Loans', value: membersWithLoans, icon: '🏦', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                        { label: 'Total Deposits', value: fmt(totalSavings), icon: '💰', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                    ].map(card => (
                        <div key={card.label} className={`glass-morphism rounded-3xl p-6 border ${card.bg} space-y-3`}>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{card.label}</span>
                                <span className="text-2xl">{card.icon}</span>
                            </div>
                            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Member Register */}
                    <div className="lg:col-span-2 glass-morphism rounded-3xl border border-border/50 overflow-hidden shadow-xl">
                        <div className="px-8 py-5 border-b border-foreground/5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                            <h2 className="text-xl font-black flex-shrink-0">Member Register</h2>
                            <input
                                type="search"
                                placeholder="Search name or email…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full sm:w-56 px-4 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-sm font-medium placeholder-foreground/30 focus:outline-none focus:border-primary/40"
                            />
                        </div>
                        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-background/80 backdrop-blur-sm">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-foreground/30 border-b border-foreground/5">
                                        <th className="px-6 py-3 text-left">Member</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-right">Savings</th>
                                        <th className="px-6 py-3 text-left">Loan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-foreground/5">
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={4} className="py-12 text-center text-foreground/20 italic font-bold text-sm">No members found</td></tr>
                                    ) : filtered.map(m => (
                                        <tr key={m.userId} className="hover:bg-foreground/3 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm">{m.name}</div>
                                                <div className="text-[10px] text-foreground/30">{m.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${m.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        m.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>{m.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-sm text-emerald-400">{fmt(m.savings)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {m.activeLoan ? (
                                                    <div className="space-y-1">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${m.activeLoan.status === 'DISBURSED' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{m.activeLoan.status}</span>
                                                        <div className="h-1 bg-foreground/10 rounded-full w-20 overflow-hidden mt-1">
                                                            <div className="h-full rounded-full bg-purple-400 transition-all" style={{ width: `${m.activeLoan.progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-[9px] text-foreground/20">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="glass-morphism rounded-3xl border border-border/50 overflow-hidden shadow-xl">
                        <div className="px-6 py-5 border-b border-foreground/5">
                            <h2 className="text-xl font-black">Live Activity</h2>
                            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest mt-1">Last 20 transactions</p>
                        </div>
                        <div className="divide-y divide-foreground/5 max-h-[480px] overflow-y-auto">
                            {transactions.length === 0 ? (
                                <div className="py-16 text-center text-foreground/20 italic font-bold text-sm">No transactions yet</div>
                            ) : transactions.map(tx => (
                                <div key={tx.id} className="px-6 py-4 flex items-start gap-3 hover:bg-foreground/3 transition-colors">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${tx.debit > 0 ? 'bg-sky-500/10' : 'bg-emerald-500/10'}`}>
                                        {tx.debit > 0 ? '↑' : '↓'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold truncate">{tx.account?.user ? `${tx.account.user.firstName} ${tx.account.user.lastName}` : 'System'}</div>
                                        <div className="text-[9px] text-foreground/30 uppercase tracking-widest">{tx.account?.accountType?.replace('_', ' ')}</div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className={`text-xs font-black ${tx.debit > 0 ? 'text-sky-400' : 'text-emerald-400'}`}>
                                            {tx.debit > 0 ? '+' : '-'}{fmt(Math.max(tx.debit, tx.credit))}
                                        </div>
                                        <div className="text-[9px] text-foreground/20">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
