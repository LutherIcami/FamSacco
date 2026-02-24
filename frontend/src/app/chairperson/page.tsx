'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats { liquidity: number; portfolioAtRisk: number; totalIncome: number; awaitingDisbursement: number; awaitingGovernance: number; }
interface Member { name: string; email: string; status: string; savings: number; activeLoan: { principal: number; status: string; progress: number } | null }
interface AuditLog { id: string; action: string; entityType: string; createdAt: string; user: { firstName: string; lastName: string } }

const fmt = (n: number) => `KES ${n.toLocaleString()}`;
const fmtMillions = (n: number) => n >= 1_000_000 ? `KES ${(n / 1_000_000).toFixed(2)}M` : fmt(n);

export default function ChairpersonDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [roster, setRoster] = useState<Member[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [cashflow, setCashflow] = useState<{ label: string; savings: number; loans: number; income: number }[]>([]);

    const fetchAll = useCallback(async (token: string) => {
        const headers = { Authorization: `Bearer ${token}` };
        const base = process.env.NEXT_PUBLIC_API_URL;
        const [s, r, a, c] = await Promise.all([
            fetch(`${base}/finance/ledger/stats`, { headers }).then(r => r.ok ? r.json() : null),
            fetch(`${base}/finance/ledger/member-roster`, { headers }).then(r => r.ok ? r.json() : []),
            fetch(`${base}/finance/audit/logs?limit=8`, { headers }).then(r => r.ok ? r.json() : []),
            fetch(`${base}/finance/ledger/cashflow`, { headers }).then(r => r.ok ? r.json() : []),
        ]);
        setStats(s); setRoster(r); setAuditLogs(a); setCashflow(c);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        if (!storedUser || !token) { router.push('/login'); return; }
        const u = JSON.parse(storedUser);
        if (!u.roles?.some((r: string) => ['super_admin', 'chairperson'].includes(r))) { router.push('/dashboard'); return; }
        setUser(u);
        fetchAll(token);
    }, [router, fetchAll]);

    if (!user) return null;

    const totalSavings = roster.reduce((s, m) => s + m.savings, 0);
    const activeMembers = roster.filter(m => m.status === 'ACTIVE').length;
    const healthScore = stats ? Math.min(100, Math.round(((stats.liquidity - stats.portfolioAtRisk) / Math.max(stats.liquidity, 1)) * 100)) : 0;
    const maxCf = Math.max(...cashflow.map(c => Math.max(c.savings, c.loans, c.income)), 1);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const actionBadge: Record<string, string> = {
        DEPOSIT_RECORDED: '💳',
        LOAN_APPLIED: '📋',
        LOAN_APPROVED: '✅',
        LOAN_REJECTED: '❌',
        LOAN_DISBURSED: '🏦',
        LOAN_REPAYMENT: '💰',
        DIVIDEND_DISTRIBUTED: '💸',
    };

    return (
        <div className="min-h-screen bg-background font-inter">
            {/* Nav */}
            <nav className="border-b border-border/50 px-8 py-4 flex justify-between items-center bg-card/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/chairperson" className="text-2xl font-black tracking-tight">Fam<span className="text-primary italic">Sacco</span></Link>
                    <div className="hidden md:flex gap-6 text-sm font-semibold text-foreground/60">
                        <Link href="/chairperson" className="text-primary">Executive</Link>
                        <Link href="/treasurer" className="hover:text-primary transition-colors">Treasury</Link>
                        <Link href="/committee/governance" className="hover:text-primary transition-colors">Governance</Link>
                        <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                        <Link href="/admin/audit" className="hover:text-primary transition-colors opacity-60">Audit</Link>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-full">Chairperson</span>
                    <span className="text-sm font-bold hidden sm:block">{user.firstName} {user.lastName}</span>
                    <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center text-sm hover:bg-foreground/10 transition-all">↪</button>
                </div>
            </nav>

            <main className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Executive Overview 👑</h1>
                        <p className="text-foreground/40 font-medium mt-1">Full financial and governance visibility across the Sacco.</p>
                    </div>
                    <div className="glass-morphism border border-border/50 rounded-2xl px-6 py-4 text-center">
                        <div className="text-[10px] font-black text-foreground/30 uppercase tracking-widest mb-1">Sacco Health Score</div>
                        <div className={`text-3xl font-black ${healthScore >= 60 ? 'text-emerald-400' : healthScore >= 30 ? 'text-amber-400' : 'text-red-400'}`}>{healthScore}<span className="text-sm">/100</span></div>
                        <div className="w-24 h-1.5 bg-foreground/10 rounded-full mt-2 overflow-hidden mx-auto">
                            <div className={`h-full rounded-full transition-all ${healthScore >= 60 ? 'bg-emerald-400' : healthScore >= 30 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${healthScore}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Top KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                        { label: 'Sacco Assets', value: fmtMillions(stats?.liquidity ?? 0), icon: '🏔', gradient: 'premium-gradient text-white', shadow: 'shadow-primary/20' },
                        { label: 'Loan Portfolio', value: fmtMillions(stats?.portfolioAtRisk ?? 0), icon: '📊', gradient: 'glass-morphism border border-purple-500/20', color: 'text-purple-400' },
                        { label: 'Interest Earned', value: fmtMillions(stats?.totalIncome ?? 0), icon: '📈', gradient: 'glass-morphism border border-emerald-500/20', color: 'text-emerald-400' },
                        { label: 'Active Members', value: String(activeMembers), icon: '👥', gradient: 'glass-morphism border border-sky-500/20', color: 'text-sky-400' },
                    ].map(card => (
                        <div key={card.label} className={`rounded-3xl p-6 space-y-3 shadow-xl ${card.gradient} ${card.shadow ?? ''}`}>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{card.label}</span>
                                <span className="text-2xl">{card.icon}</span>
                            </div>
                            <div className={`text-2xl font-black ${card.color ?? 'text-white'}`}>{card.value}</div>
                        </div>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cashflow + Alerts */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Cashflow Chart */}
                        <div className="glass-morphism rounded-3xl p-8 border border-border/50 space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black">6-Month Financial Trend</h2>
                                    <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">Savings Inflows · Loan Disbursements · Interest Revenue</p>
                                </div>
                                <div className="flex gap-3 text-[9px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>Savings</span>
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span>Loans</span>
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>Interest</span>
                                </div>
                            </div>
                            <div className="flex items-end gap-3 h-36">
                                {cashflow.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-foreground/20 font-bold italic text-sm">No data yet — transactions will appear here</div>
                                ) : cashflow.map(m => (
                                    <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                                        <div className="w-full flex items-end gap-0.5" style={{ height: '110px' }}>
                                            {[{ v: m.savings, cls: 'bg-primary' }, { v: m.loans, cls: 'bg-purple-400' }, { v: m.income, cls: 'bg-emerald-400' }].map((b, i) => (
                                                <div key={i} title={fmt(b.v)} className={`flex-1 ${b.cls} rounded-t-sm opacity-70 group-hover:opacity-100 transition-all`} style={{ height: `${(b.v / maxCf) * 100}%`, minHeight: b.v > 0 ? 3 : 0 }}></div>
                                            ))}
                                        </div>
                                        <span className="text-[9px] font-black text-foreground/30 uppercase tracking-wider">{m.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Governance Queue Alert */}
                        <div className={`rounded-3xl p-6 border flex items-center gap-5 ${(stats?.awaitingGovernance ?? 0) > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'glass-morphism border-border/50'}`}>
                            <div className="text-4xl">{(stats?.awaitingGovernance ?? 0) > 0 ? '⚠️' : '✅'}</div>
                            <div className="flex-1">
                                <div className="font-black text-lg">{(stats?.awaitingGovernance ?? 0) > 0 ? `${stats!.awaitingGovernance} Loan${stats!.awaitingGovernance > 1 ? 's' : ''} Awaiting Board Approval` : 'Governance Queue is Clear'}</div>
                                <p className="text-foreground/40 text-sm">{(stats?.awaitingGovernance ?? 0) > 0 ? 'Committee members must vote before the Treasurer can disburse these funds.' : 'No large loan requests are pending committee review.'}</p>
                            </div>
                            {(stats?.awaitingGovernance ?? 0) > 0 && (
                                <Link href="/committee/governance" className="px-5 py-2.5 rounded-2xl premium-gradient text-white font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all flex-shrink-0">
                                    Review →
                                </Link>
                            )}
                        </div>

                        {/* Member Wealth Distribution */}
                        <div className="glass-morphism rounded-3xl p-8 border border-border/50 space-y-5">
                            <h2 className="text-xl font-black">Member Wealth Distribution</h2>
                            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                                {roster.length === 0 ? (
                                    <p className="text-center text-foreground/20 italic font-bold py-8">No member accounts enrolled yet</p>
                                ) : [...roster].sort((a, b) => b.savings - a.savings).map((m, i) => {
                                    const pct = totalSavings > 0 ? (m.savings / totalSavings) * 100 : 0;
                                    return (
                                        <div key={m.email} className="flex items-center gap-4">
                                            <div className="w-6 text-[10px] font-black text-foreground/20 text-right">{i + 1}</div>
                                            <div className="min-w-0 w-28 flex-shrink-0">
                                                <div className="text-xs font-bold truncate">{m.name}</div>
                                            </div>
                                            <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700 premium-gradient" style={{ width: `${pct}%` }}></div>
                                            </div>
                                            <div className="text-right w-24 flex-shrink-0">
                                                <div className="text-xs font-black text-emerald-400">{fmt(m.savings)}</div>
                                                <div className="text-[9px] text-foreground/25">{pct.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Links */}
                        <div className="glass-morphism rounded-3xl p-6 border border-border/50 space-y-3">
                            <h2 className="text-lg font-black">Command Shortcuts</h2>
                            {[
                                { href: '/treasurer', label: 'Treasury Dashboard', icon: '🏦', desc: 'Cashflow, approvals, dividends' },
                                { href: '/secretary', label: 'Secretariat Portal', icon: '📝', desc: 'Member register, activity' },
                                { href: '/committee/governance', label: 'Governance Board', icon: '🏛️', desc: 'Vote on loan requests' },
                                { href: '/finance', label: 'Double-Entry Ledger', icon: '📒', desc: 'Full accounting view' },
                                { href: '/admin/audit', label: 'Audit Logs', icon: '🛡️', desc: 'Immutable system history' },
                            ].map(link => (
                                <Link key={link.href} href={link.href} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-foreground/5 transition-all group border border-transparent hover:border-foreground/5">
                                    <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{link.icon}</div>
                                    <div>
                                        <div className="text-sm font-black">{link.label}</div>
                                        <div className="text-[10px] text-foreground/30">{link.desc}</div>
                                    </div>
                                    <span className="ml-auto text-foreground/20 group-hover:text-primary transition-colors">→</span>
                                </Link>
                            ))}
                        </div>

                        {/* Audit Trail */}
                        <div className="glass-morphism rounded-3xl border border-border/50 overflow-hidden">
                            <div className="px-6 py-5 border-b border-foreground/5 flex justify-between items-center">
                                <h2 className="text-lg font-black">Recent Activity</h2>
                                <Link href="/admin/audit" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">All →</Link>
                            </div>
                            <div className="divide-y divide-foreground/5">
                                {auditLogs.length === 0 ? (
                                    <div className="py-10 text-center text-foreground/20 italic text-sm font-bold">No system activity yet</div>
                                ) : auditLogs.map(log => (
                                    <div key={log.id} className="px-6 py-4 flex items-start gap-3 hover:bg-foreground/3 transition-colors">
                                        <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center text-sm flex-shrink-0">
                                            {actionBadge[log.action] ?? '🔹'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold truncate">{log.user.firstName} {log.user.lastName}</div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-foreground/30">{log.action.replace(/_/g, ' ')}</div>
                                        </div>
                                        <div className="text-[9px] text-foreground/20 flex-shrink-0">{new Date(log.createdAt).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Financial Summary Panel */}
                        <div className="rounded-3xl p-6 premium-gradient text-white space-y-5 shadow-2xl shadow-primary/20">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Sacco Financial Position</div>
                            {[
                                { label: 'Total Assets (Liquidity)', value: fmtMillions(stats?.liquidity ?? 0) },
                                { label: 'Active Loan Portfolio', value: fmtMillions(stats?.portfolioAtRisk ?? 0) },
                                { label: 'Net Member Savings', value: fmtMillions(totalSavings) },
                                { label: 'Distributable Income', value: fmtMillions(stats?.totalIncome ?? 0) },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center">
                                    <span className="text-white/60 text-xs">{row.label}</span>
                                    <span className="font-black text-sm">{row.value}</span>
                                </div>
                            ))}
                            <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                                <span className="text-white/60 text-xs font-black uppercase tracking-widest">Enrolled Members</span>
                                <span className="font-black text-lg">{roster.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
