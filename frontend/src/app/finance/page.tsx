'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Transaction {
    id: string;
    debit: string;
    credit: string;
    createdAt: string;
    account: {
        accountType: string;
        user?: {
            firstName: string;
            lastName: string;
        };
    };
}

export default function LedgerPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDividendModal, setShowDividendModal] = useState(false);
    const [potentialDividends, setPotentialDividends] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [formData, setFormData] = useState({ userId: '', amount: '', month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');

        if (!storedUser || !token) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchData(token, parsedUser);

        if (parsedUser.roles?.includes('super_admin') || parsedUser.roles?.includes('treasurer')) {
            fetchMembers(token);
            fetchPotentialDividends(token);
        }
    }, [router]);

    const fetchPotentialDividends = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/dividends/potential`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setPotentialDividends(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const handleDistributeDividends = async () => {
        const token = localStorage.getItem('access_token');
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/dividends/distribute`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setShowDividendModal(false);
                fetchData(token!, user);
                fetchPotentialDividends(token!);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async (token: string) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setMembers(await res.json());
    };

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/contributions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, amount: Number(formData.amount) })
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({ userId: '', amount: '', month: formData.month });
                fetchData(token!, user);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchData = async (token: string, user: any) => {
        try {
            // Fetch Stats
            const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/ledger/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statsRes.ok) setStats(await statsRes.json());

            // Fetch Transactions
            const transRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/ledger/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (transRes.ok) setTransactions(await transRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;
    const isAdmin = user.roles?.includes('super_admin') || user.roles?.includes('treasurer');

    return (
        <div className="min-h-screen bg-background flex flex-col font-inter">
            <nav className="border-b border-border/50 px-8 py-4 flex justify-between items-center bg-card/30 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-2xl font-black tracking-tight">
                        Fam<span className="text-primary italic">Sacco</span>
                    </Link>
                    <div className="flex gap-6 text-sm font-semibold text-foreground/60">
                        <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                        {isAdmin && <Link href="/admin/members" className="hover:text-primary transition-colors">Members</Link>}
                        {isAdmin && <Link href="/admin/loans" className="hover:text-primary transition-colors">Loan Queue</Link>}
                        <Link href="/finance" className="text-primary transition-colors">Ledger</Link>
                    </div>
                </div>
            </nav>

            <main className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
                <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight">
                            {isAdmin ? 'System Global Ledger' : 'My Financial Ledger'}
                        </h1>
                        <p className="text-foreground/40 font-medium font-inter">Verified double-entry accounting records.</p>
                    </div>

                    <div className="flex gap-4">
                        {isAdmin && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 rounded-xl accent-gradient text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                            >
                                + Record Member Deposit
                            </button>
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
                                    a.download = `statement_${new Date().toISOString().split('T')[0]}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                }
                            }}
                            className="px-6 py-3 rounded-xl bg-foreground/5 border border-foreground/10 font-black text-sm hover:bg-foreground/10 transition-all flex items-center gap-2"
                        >
                            <span>📥</span> Download PDF Statement
                        </button>
                    </div>
                </section>

                {/* Deposit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                        <div className="bg-card w-full max-w-lg rounded-[32px] border border-white/10 p-10 shadow-3xl relative z-10 glass-morphism animate-in zoom-in-95 duration-300">
                            <h2 className="text-2xl font-black tracking-tight mb-6">Record New Deposit</h2>
                            <form onSubmit={handleDeposit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-foreground/40 px-1">Select Member</label>
                                    <select
                                        required
                                        className="w-full bg-foreground/5 border border-foreground/5 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                                        value={formData.userId}
                                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                    >
                                        <option value="" className="bg-background">Choose a family member...</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id} className="bg-background">{m.firstName} {m.lastName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-foreground/40 px-1">Amount (KES)</label>
                                        <input
                                            required
                                            type="number"
                                            placeholder="0,000"
                                            className="w-full bg-foreground/5 border border-foreground/5 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 transition-all font-bold"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-foreground/40 px-1">Month</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-foreground/5 border border-foreground/5 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 transition-all font-bold"
                                            value={formData.month}
                                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 rounded-2xl bg-foreground/5 font-black text-sm uppercase tracking-widest hover:bg-foreground/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 rounded-2xl accent-gradient text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Confirm & Post
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isAdmin && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 font-inter">
                        <div className="p-8 rounded-[2rem] premium-gradient text-white space-y-2 shadow-xl shadow-primary/10 transition-transform hover:scale-[1.02]">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Total Savings Pool</div>
                            <div className="text-3xl font-black tracking-tighter">KES {Number(stats.totalSavings || 0).toLocaleString()}</div>
                        </div>
                        <div className="p-8 rounded-[2rem] savings-gradient text-white space-y-2 shadow-xl shadow-emerald-500/10 transition-transform hover:scale-[1.02]">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Total Disbursed</div>
                            <div className="text-3xl font-black tracking-tighter">KES {Number(stats.totalDisbursed || 0).toLocaleString()}</div>
                        </div>
                        <div className="p-8 rounded-[2rem] glass-morphism border border-foreground/10 space-y-2 transition-transform hover:scale-[1.02]">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Liquid Reserves</div>
                            <div className="text-3xl font-black tracking-tighter text-primary">KES {(Number(stats.totalSavings || 0) - Number(stats.totalDisbursed || 0)).toLocaleString()}</div>
                        </div>
                        <div className="p-8 rounded-[2rem] accent-gradient text-white space-y-2 shadow-xl shadow-purple-500/10 transition-transform hover:scale-[1.02] cursor-pointer" onClick={() => setShowDividendModal(true)}>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Interest Income (Pool)</div>
                            <div className="text-3xl font-black tracking-tighter">KES {Number(stats.totalIncome || 0).toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-white/50 underline">Distribute Dividends →</div>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-foreground/5 border border-foreground/10 space-y-2 transition-transform hover:scale-[1.02]">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Active Requests</div>
                            <div className="text-3xl font-black tracking-tighter">{stats.pendingLoans}</div>
                        </div>
                    </div>
                )}

                {/* Dividend Modal */}
                {showDividendModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowDividendModal(false)}></div>
                        <div className="bg-card w-full max-w-2xl rounded-[32px] border border-white/10 p-10 shadow-3xl relative z-10 glass-morphism animate-in zoom-in-95 duration-300">
                            <h2 className="text-3xl font-black tracking-tight mb-2">Distribute Dividends</h2>
                            <p className="text-foreground/40 text-sm mb-8">This will distribute all current interest income (KES {Number(stats.totalIncome || 0).toLocaleString()}) to members proportionally based on their savings.</p>

                            {potentialDividends && (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                    {potentialDividends.memberBreakdown.map((m: any) => (
                                        <div key={m.userId} className="p-4 rounded-2xl bg-foreground/5 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold">{m.name}</div>
                                                <div className="text-xs text-foreground/40 uppercase tracking-widest font-black">Savings: KES {m.balance.toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-primary font-black">+ KES {m.projectedDividend.toLocaleString()}</div>
                                                <div className="text-[10px] text-foreground/30 font-bold">{(m.share * 100).toFixed(2)}% SHARE</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-4 pt-8">
                                <button
                                    onClick={() => setShowDividendModal(false)}
                                    className="flex-1 py-4 rounded-2xl bg-foreground/5 font-black text-sm uppercase tracking-widest hover:bg-foreground/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDistributeDividends}
                                    disabled={loading || (stats.totalIncome || 0) <= 0}
                                    className="flex-[2] py-4 rounded-2xl premium-gradient text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    Execute Proportional Distribution
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="glass-morphism rounded-3xl overflow-hidden border border-border/50 shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-foreground/5 border-b border-foreground/10 text-xs font-black uppercase tracking-widest text-foreground/40">
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Account / Entity</th>
                                <th className="px-8 py-5">Transaction ID</th>
                                <th className="px-8 py-5 text-right text-red-400">Debit (-)</th>
                                <th className="px-8 py-5 text-right text-emerald-400">Credit (+)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/5">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center animate-pulse font-bold opacity-20">Syncing with Ledger...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={5} className="py-20 text-center italic font-bold opacity-20 text-sm">No transaction history found.</td></tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-foreground/5 transition-colors">
                                        <td className="px-8 py-5 text-sm text-foreground/60">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-sm">
                                                {tx.account.user ? `${tx.account.user.firstName} ${tx.account.user.lastName}` : 'System Pool'}
                                            </div>
                                            <div className="text-[10px] font-black tracking-widest uppercase text-foreground/30">{tx.account.accountType}</div>
                                        </td>
                                        <td className="px-8 py-5 text-xs font-mono opacity-40">#{tx.id.substring(0, 8)}</td>
                                        <td className="px-8 py-5 text-right text-sm font-bold text-red-400/80">
                                            {tx.debit !== "0" ? `KES ${Number(tx.debit).toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-8 py-5 text-right text-sm font-bold text-emerald-400/80">
                                            {tx.credit !== "0" ? `KES ${Number(tx.credit).toLocaleString()}` : '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
