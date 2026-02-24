'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats { liquidity: number; portfolioAtRisk: number; totalIncome: number; awaitingDisbursement: number; awaitingGovernance: number; }
interface Cashflow { label: string; savings: number; loans: number; income: number; }
interface Member { userId: string; name: string; email: string; status: string; savings: number; activeLoan: { principal: number; totalPayable: number; status: string; repaid: number; progress: number } | null }
interface Loan { id: string; principalAmount: string; totalPayable: string; status: string; user: { firstName: string; lastName: string; email: string } }

const fmt = (n: number) => `KES ${n.toLocaleString()}`;

export default function TreasurerDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [cashflow, setCashflow] = useState<Cashflow[]>([]);
    const [roster, setRoster] = useState<Member[]>([]);
    const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
    const [dividendPreview, setDividendPreview] = useState<any>(null);
    const [showDividend, setShowDividend] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchAll = useCallback(async (token: string) => {
        const headers = { Authorization: `Bearer ${token}` };
        const base = process.env.NEXT_PUBLIC_API_URL;
        const [s, cf, r, l, d] = await Promise.all([
            fetch(`${base}/finance/ledger/stats`, { headers }).then(r => r.ok ? r.json() : null),
            fetch(`${base}/finance/ledger/cashflow`, { headers }).then(r => r.ok ? r.json() : []),
            fetch(`${base}/finance/ledger/member-roster`, { headers }).then(r => r.ok ? r.json() : []),
            fetch(`${base}/loans/pending`, { headers }).then(r => r.ok ? r.json() : []),
            fetch(`${base}/finance/dividends/potential`, { headers }).then(r => r.ok ? r.json() : null),
        ]);
        setStats(s); setCashflow(cf); setRoster(r); setPendingLoans(l); setDividendPreview(d);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        if (!storedUser || !token) { router.push('/login'); return; }
        const u = JSON.parse(storedUser);
        if (!u.roles?.some((r: string) => ['treasurer', 'super_admin'].includes(r))) { router.push('/dashboard'); return; }
        setUser(u);
        fetchAll(token);
    }, [router, fetchAll]);

    const approveLoan = async (id: string, status: 'APPROVED' | 'DISBURSED' | 'REJECTED') => {
        const token = localStorage.getItem('access_token')!;
        setActionLoading(id + status);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/loans/${id}/status`, {
            method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        setActionLoading(null);
        fetchAll(token);
    };

    const distributeDividends = async () => {
        const token = localStorage.getItem('access_token')!;
        setActionLoading('dividend');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/dividends/distribute`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        setActionLoading(null);
        setShowDividend(false);
        fetchAll(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const maxCashflow = Math.max(...cashflow.map(c => Math.max(c.savings, c.loans, c.income)), 1);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background font-inter">
            {/* Nav */}
            <nav className="border-b border-border/50 px-8 py-4 flex justify-between items-center bg-card/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-2xl font-black tracking-tight">Fam<span className="text-primary italic">Sacco</span></Link>
                    <div className="hidden md:flex gap-6 text-sm font-semibold text-foreground/60">
                        <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                        <Link href="/treasurer" className="text-primary">Treasury</Link>
                        <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                        <Link href="/admin/members" className="hover:text-primary transition-colors">Members</Link>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">Treasurer</span>
                    <span className="text-sm font-bold hidden sm:block">{user.firstName} {user.lastName}</span>
                    <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center text-sm hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all" title="Log out">↪</button>
                </div>
            </nav>

            <main className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <section>
                    <h1 className="text-4xl font-black tracking-tight">Treasury Command Centre 🏦</h1>
                    <p className="text-foreground/40 font-medium mt-1">Real-time financial health, disbursements, and dividend management.</p>
                </section>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                        { label: 'Liquidity Pool', value: fmt(stats?.liquidity ?? 0), icon: '💧', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                        { label: 'Portfolio at Risk', value: fmt(stats?.portfolioAtRisk ?? 0), icon: '📊', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                        { label: 'Interest Income', value: fmt(stats?.totalIncome ?? 0), icon: '📈', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                        { label: 'Awaiting Approval', value: String((stats?.awaitingDisbursement ?? 0) + (stats?.awaitingGovernance ?? 0)), icon: '⏳', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
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

                {/* Two-column: Chart + Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Cashflow Chart */}
                    <div className="lg:col-span-3 glass-morphism rounded-3xl p-8 border border-border/50 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black">6-Month Cashflow</h2>
                            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>Savings In</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-400 inline-block"></span>Loans Out</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>Interest</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-3 h-44">
                            {cashflow.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-foreground/20 font-bold italic text-sm">No cashflow data yet</div>
                            ) : cashflow.map((m) => (
                                <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                                    <div className="w-full flex items-end gap-0.5" style={{ height: '140px' }}>
                                        {[
                                            { v: m.savings, color: 'bg-sky-400' },
                                            { v: m.loans, color: 'bg-purple-400' },
                                            { v: m.income, color: 'bg-emerald-400' },
                                        ].map((bar, i) => (
                                            <div key={i} title={fmt(bar.v)} className={`flex-1 ${bar.color} rounded-t-sm opacity-80 group-hover:opacity-100 transition-all`} style={{ height: `${(bar.v / maxCashflow) * 100}%`, minHeight: bar.v > 0 ? 4 : 0 }}></div>
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-black text-foreground/30 uppercase tracking-wider">{m.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Dividend Distribution */}
                        <div className="glass-morphism rounded-3xl p-6 border border-emerald-500/20 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl savings-gradient flex items-center justify-center text-xl">💸</div>
                                <div>
                                    <div className="font-black text-sm">Dividend Distribution</div>
                                    <div className="text-[10px] text-foreground/30 font-bold">Pool: {fmt(dividendPreview?.totalIncome ?? 0)}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDividend(true)}
                                disabled={(dividendPreview?.totalIncome ?? 0) <= 0}
                                className="w-full py-3 rounded-2xl savings-gradient text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {(dividendPreview?.totalIncome ?? 0) > 0 ? 'Distribute to Members →' : 'No Income to Distribute'}
                            </button>
                        </div>

                        {/* Pending Loans */}
                        <div className="glass-morphism rounded-3xl p-6 border border-border/50 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center text-xl">📋</div>
                                <div>
                                    <div className="font-black text-sm">Loan Approvals</div>
                                    <div className="text-[10px] text-foreground/30 font-bold">{pendingLoans.length} pending request{pendingLoans.length !== 1 ? 's' : ''}</div>
                                </div>
                            </div>
                            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                                {pendingLoans.length === 0 ? (
                                    <p className="text-[11px] text-foreground/25 italic font-bold text-center py-4">Queue is clear ✓</p>
                                ) : pendingLoans.map(loan => (
                                    <div key={loan.id} className="p-3 rounded-2xl bg-foreground/5 border border-foreground/5 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-xs font-black">{loan.user.firstName} {loan.user.lastName}</div>
                                                <div className="text-[10px] text-foreground/40">{fmt(Number(loan.principalAmount))}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button disabled={!!actionLoading} onClick={() => approveLoan(loan.id, 'APPROVED')} className="flex-1 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase hover:bg-emerald-500/30 transition-all disabled:opacity-50">Approve</button>
                                            <button disabled={!!actionLoading} onClick={() => approveLoan(loan.id, 'DISBURSED')} className="flex-1 py-1.5 rounded-xl premium-gradient text-white text-[10px] font-black uppercase hover:opacity-90 transition-all disabled:opacity-50">Disburse</button>
                                            <button disabled={!!actionLoading} onClick={() => approveLoan(loan.id, 'REJECTED')} className="flex-1 py-1.5 rounded-xl bg-foreground/10 text-foreground/40 text-[10px] font-black uppercase hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Member Roster */}
                <div className="glass-morphism rounded-3xl border border-border/50 overflow-hidden shadow-xl">
                    <div className="px-8 py-5 border-b border-foreground/5 flex justify-between items-center">
                        <h2 className="text-xl font-black">Member Savings Roster</h2>
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">{roster.length} members enrolled</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-foreground/30 border-b border-foreground/5">
                                    <th className="px-8 py-4 text-left">Member</th>
                                    <th className="px-8 py-4 text-right">Savings</th>
                                    <th className="px-8 py-4 text-left">Loan Status</th>
                                    <th className="px-8 py-4 text-left">Repayment Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-foreground/5">
                                {roster.length === 0 ? (
                                    <tr><td colSpan={4} className="py-16 text-center text-foreground/20 italic font-bold text-sm">No member accounts found</td></tr>
                                ) : roster.map(m => (
                                    <tr key={m.userId} className="hover:bg-foreground/3 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="font-bold text-sm">{m.name}</div>
                                            <div className="text-[10px] text-foreground/30">{m.email}</div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="font-black text-sm text-emerald-400">{fmt(m.savings)}</div>
                                        </td>
                                        <td className="px-8 py-4">
                                            {m.activeLoan ? (
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${m.activeLoan.status === 'DISBURSED' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    m.activeLoan.status === 'REQUESTED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                                    }`}>{m.activeLoan.status}</span>
                                            ) : (
                                                <span className="text-[9px] text-foreground/20 font-black uppercase">No Active Loan</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-4">
                                            {m.activeLoan ? (
                                                <div className="space-y-1 min-w-[160px]">
                                                    <div className="flex justify-between text-[9px] font-black text-foreground/40 uppercase tracking-widest">
                                                        <span>{fmt(m.activeLoan.repaid)} paid</span>
                                                        <span>{m.activeLoan.progress.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.activeLoan.progress}%`, background: m.activeLoan.progress >= 80 ? '#34d399' : m.activeLoan.progress >= 40 ? '#a78bfa' : '#f59e0b' }}></div>
                                                    </div>
                                                </div>
                                            ) : <span className="text-[9px] text-foreground/20 italic">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Dividend Modal */}
            {showDividend && dividendPreview && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-morphism border border-emerald-500/30 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black">Confirm Dividend Distribution 💸</h3>
                            <p className="text-foreground/40 text-sm">Proportional share of <strong className="text-emerald-400">{fmt(dividendPreview.totalIncome)}</strong> will be credited to {dividendPreview.memberBreakdown?.length} members.</p>
                        </div>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {dividendPreview.memberBreakdown?.map((m: any) => (
                                <div key={m.userId} className="flex justify-between items-center p-3 rounded-2xl bg-foreground/5">
                                    <span className="text-sm font-bold">{m.name}</span>
                                    <span className="text-emerald-400 font-black text-sm">+{fmt(Number(m.projectedDividend.toFixed(2)))}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button disabled={actionLoading === 'dividend'} onClick={distributeDividends} className="flex-1 py-4 rounded-2xl savings-gradient text-white font-black uppercase tracking-widest text-sm hover:scale-[1.02] transition-all disabled:opacity-50">
                                {actionLoading === 'dividend' ? 'Processing…' : '✓ Execute Distribution'}
                            </button>
                            <button onClick={() => setShowDividend(false)} className="px-6 py-4 rounded-2xl bg-foreground/5 font-black uppercase tracking-widest text-sm hover:bg-foreground/10 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
