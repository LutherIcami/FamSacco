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
        <div className="min-h-screen bg-background flex flex-col font-inter">
            {/* Floating Navigation */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-6xl px-6">
                <nav className="glass-morphism rounded-full px-8 py-4 flex justify-between items-center bg-white/60 shadow-2xl border border-primary/5">
                    <div className="flex items-center gap-12">
                        <Link href="/dashboard" className="text-2xl font-black tracking-tight hover:scale-105 transition-transform">
                            Fam<span className="text-primary italic">Sacco</span>
                        </Link>
                        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">
                            <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                            <Link href="/treasurer" className="text-primary">Treasury</Link>
                            <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                            <Link href="/admin/members" className="hover:text-primary transition-colors">Members</Link>
                        </div>
                    </div>
                </nav>
            </div>

            <div className="h-24"></div>

            <main className="p-8 max-w-7xl mx-auto w-full space-y-12 animate-reveal">
                {/* Header */}
                <section className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Treasury</h1>
                        <p className="text-lg text-foreground/40 font-medium italic">Maintaining the collective family liquidity.</p>
                    </div>
                    <div className="px-6 py-3 rounded-full bg-secondary/10 border border-secondary/10 flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary anim-pulse">● System Secured</span>
                    </div>
                </section>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Liquidity Pool', value: fmt(stats?.liquidity ?? 0), icon: '💧', color: 'text-primary' },
                        { label: 'Portfolio at Risk', value: fmt(stats?.portfolioAtRisk ?? 0), icon: '📊', color: 'text-secondary' },
                        { label: 'Total Income', value: fmt(stats?.totalIncome ?? 0), icon: '📈', color: 'text-secondary' },
                        { label: 'Pending Review', value: String((stats?.awaitingDisbursement ?? 0) + (stats?.awaitingGovernance ?? 0)), icon: '⏳', color: 'text-foreground/40' },
                    ].map((card, i) => (
                        <div key={card.label} className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-xl hover-lift animate-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20">{card.label}</span>
                                <span className="text-2xl grayscale scale-75 opacity-20">{card.icon}</span>
                            </div>
                            <div className={`text-2xl font-black tracking-tighter ${card.color}`}>{card.value}</div>
                        </div>
                    ))}
                </div>

                {/* Bento Grid: Chart + Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cashflow Chart */}
                    <div className="lg:col-span-8 bg-white rounded-[3.5rem] p-10 border border-primary/5 shadow-2xl space-y-8 hover-lift">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black tracking-tighter">Periodic Cashflow</h2>
                            <div className="flex gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40">
                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary/20"></span>Savings</span>
                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary/20"></span>Disbursements</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-4 h-64 px-4">
                            {cashflow.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-foreground/10 font-black italic text-4xl uppercase tracking-tighter">DATA SYNCING...</div>
                            ) : cashflow.map((m) => (
                                <div key={m.label} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div className="w-full flex items-end gap-1" style={{ height: '180px' }}>
                                        {[
                                            { v: m.savings, color: 'bg-primary/20 group-hover:bg-primary transition-colors' },
                                            { v: m.loans, color: 'bg-secondary/20 group-hover:bg-secondary transition-colors' },
                                        ].map((bar, i) => (
                                            <div key={i} title={fmt(bar.v)} className={`flex-1 ${bar.color} rounded-full`} style={{ height: `${(bar.v / maxCashflow) * 100}%`, minHeight: bar.v > 0 ? 8 : 0 }}></div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">{m.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[3rem] p-8 border border-primary/5 shadow-2xl space-y-6 hover-lift">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black tracking-tight">Dividends</h3>
                                <p className="text-xs text-foreground/30 font-medium">Accumulated interest distribution hub.</p>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-secondary/5 border border-secondary/10 text-center">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/60 mb-1">Available Pool</div>
                                <div className="text-3xl font-black tracking-tighter text-secondary">{fmt(dividendPreview?.totalIncome ?? 0)}</div>
                            </div>
                            <button
                                onClick={() => setShowDividend(true)}
                                disabled={(dividendPreview?.totalIncome ?? 0) <= 0}
                                className="w-full py-5 rounded-2xl gold-gradient text-white font-black text-xs uppercase tracking-[0.2em] shadow-gold disabled:opacity-10 transition-transform active:scale-95"
                            >
                                Execute Distribution →
                            </button>
                        </div>

                        {/* Recent Requests Small List */}
                        <div className="bg-foreground/5 rounded-[3rem] p-8 border border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20">Awaiting Signature</h4>
                            <div className="space-y-3">
                                {pendingLoans.length === 0 ? (
                                    <p className="text-xs text-foreground/20 italic font-bold py-8 text-center">Queue Neutralized.</p>
                                ) : pendingLoans.slice(0, 3).map(loan => (
                                    <div key={loan.id} className="p-4 rounded-2xl bg-white/50 border border-white/50 flex justify-between items-center">
                                        <div>
                                            <div className="text-xs font-black">{loan.user.firstName}</div>
                                            <div className="text-[10px] text-foreground/30">{fmt(Number(loan.principalAmount))}</div>
                                        </div>
                                        <button onClick={() => approveLoan(loan.id, 'APPROVED')} className="text-[10px] font-black uppercase text-primary hover:underline">Select</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Member Matrix */}
                <div className="bg-white rounded-[4rem] border border-primary/5 shadow-2xl overflow-hidden hover-lift">
                    <div className="px-10 py-8 border-b border-foreground/[0.02] flex justify-between items-center">
                        <h2 className="text-3xl font-black tracking-tighter">Financial Matrix</h2>
                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">{roster.length} Active Records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/10 border-b border-foreground/[0.02]">
                                    <th className="px-10 py-6 text-left">Entity</th>
                                    <th className="px-10 py-6 text-right">Liquidity</th>
                                    <th className="px-10 py-6 text-left">Risk Assessment</th>
                                    <th className="px-10 py-6 text-left">Maturity</th>
                                    <th className="px-10 py-6 text-right">Archival</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-foreground/[0.02]">
                                {roster.map(m => (
                                    <tr key={m.userId} className="hover:bg-foreground/[0.01] transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="font-black text-lg tracking-tight">{m.name}</div>
                                            <div className="text-[10px] text-foreground/20 font-bold">{m.email}</div>
                                        </td>
                                        <td className="px-10 py-8 text-right font-black text-secondary tracking-tighter text-lg">
                                            {fmt(m.savings)}
                                        </td>
                                        <td className="px-10 py-8">
                                            {m.activeLoan ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="w-2 h-2 rounded-full bg-secondary anim-pulse"></span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">{m.activeLoan.status}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-foreground/10 font-black uppercase">Neutral</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-8">
                                            {m.activeLoan ? (
                                                <div className="w-48 space-y-2">
                                                    <div className="h-1 bg-foreground/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary/40 rounded-full transition-all duration-1000" style={{ width: `${m.activeLoan.progress}%` }}></div>
                                                    </div>
                                                    <div className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">{m.activeLoan.progress.toFixed(0)}% Repaid</div>
                                                </div>
                                            ) : <span className="text-xl opacity-10">—</span>}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button className="text-foreground/10 hover:text-black transition-colors opacity-0 group-hover:opacity-100">
                                                <span className="text-2xl">📥</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Dividend Modal Upgrade */}
            {showDividend && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-reveal">
                    <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full border border-primary/5 shadow-2xl space-y-10">
                        <div className="text-center space-y-3">
                            <div className="text-5xl mb-4">🏛️</div>
                            <h3 className="text-3xl font-black tracking-tighter uppercase">Authorize Yield</h3>
                            <p className="text-sm text-foreground/40 font-medium leading-relaxed px-8">Confirming the distribution of <span className="text-secondary font-black">{fmt(dividendPreview?.totalIncome ?? 0)}</span> across the family network.</p>
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto px-4">
                            {dividendPreview?.memberBreakdown?.map((m: any) => (
                                <div key={m.userId} className="flex justify-between items-center py-4 border-b border-foreground/5">
                                    <span className="text-sm font-black">{m.name}</span>
                                    <span className="text-secondary font-black text-sm">+{fmt(Number(m.projectedDividend.toFixed(2)))}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={distributeDividends} className="flex-[2] py-6 rounded-3xl gold-gradient text-white font-black uppercase tracking-widest text-xs hover:scale-[1.02] shadow-gold transition-all">
                                {actionLoading === 'dividend' ? 'EXECUTING...' : 'Confirm Distribution'}
                            </button>
                            <button onClick={() => setShowDividend(false)} className="flex-1 py-6 rounded-3xl bg-foreground/5 font-black uppercase tracking-widest text-[10px] hover:bg-foreground/10 transition-colors">Abort</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
