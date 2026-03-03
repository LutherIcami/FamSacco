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
            {/* Floating Navigation */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-6">
                <nav className="glass-morphism rounded-full px-8 py-4 flex justify-between items-center bg-white/60 shadow-2xl border border-primary/5">
                    <div className="flex items-center gap-12">
                        <Link href="/dashboard" className="text-2xl font-black tracking-tight hover:scale-105 transition-transform">
                            Fam<span className="text-primary italic">Sacco</span>
                        </Link>
                        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">
                            <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                            <Link href="/finance" className="text-primary">Ledger</Link>
                            <Link href="/loans" className="hover:text-primary transition-colors">Loans</Link>
                            <Link href="/social" className="hover:text-primary transition-colors">Social</Link>
                            {user.roles?.some((r: string) => ['super_admin', 'treasurer'].includes(r)) && (
                                <Link href="/admin/members" className="hover:text-primary transition-colors">Admin</Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold">{user.firstName} {user.lastName}</div>
                            <div className="text-[9px] text-foreground/30 font-black uppercase tracking-[0.2em]">Internal Ledger</div>
                        </div>
                    </div>
                </nav>
            </div>

            <div className="h-24"></div>

            <main className="p-8 max-w-7xl mx-auto w-full space-y-12 animate-reveal">
                <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                            {isAdmin ? 'Central Vault' : 'Financial DNA'}
                        </h1>
                        <p className="text-lg text-foreground/40 font-medium">Verified double-entry ledger history.</p>
                    </div>

                    <div className="flex gap-4">
                        {isAdmin && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-8 py-4 rounded-2xl gold-gradient text-white font-black text-xs uppercase tracking-widest shadow-gold hover-lift"
                            >
                                + Post Entry
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
                                    a.download = `ledger_v1.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                }
                            }}
                            className="px-8 py-4 rounded-2xl bg-white border border-primary/5 font-black text-xs uppercase tracking-widest hover:bg-foreground/5 transition-all shadow-sm hover-lift"
                        >
                            📊 Export PDF
                        </button>
                    </div>
                </section>

                {isAdmin && stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Vault Balance', value: Number(stats.totalSavings || 0), icon: '🏦', gradient: 'premium-gradient text-white' },
                            { label: 'Outward Capital', value: Number(stats.totalDisbursed || 0), icon: '💸', gradient: 'bg-white border border-primary/5 text-primary' },
                            { label: 'Yield Gained', value: Number(stats.totalIncome || 0), icon: '📈', gradient: 'gold-gradient text-white' },
                            { label: 'Open Queues', value: stats.pendingLoans || 0, icon: '🛡️', gradient: 'bg-white border border-secondary/20 text-secondary' },
                        ].map((card, i) => (
                            <div key={card.label} className={`rounded-[2.5rem] p-8 space-y-3 shadow-sm hover-lift ${card.gradient} animate-reveal`} style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{card.label}</span>
                                    <span className="text-2xl">{card.icon}</span>
                                </div>
                                <div className="text-2xl font-black tracking-tighter">
                                    {typeof card.value === 'number' && card.label !== 'Open Queues' ? `KES ${card.value.toLocaleString()}` : card.value}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modern Transaction List */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-2xl font-black tracking-tighter text-foreground/60">Journal Entries</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20">Live Sync Active</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="text-center py-20 animate-pulse font-black text-foreground/10 text-4xl">DECRYPTING LEDGER...</div>
                        ) : transactions.length === 0 ? (
                            <div className="glass-morphism rounded-[3rem] p-20 text-center border border-dashed border-primary/10">
                                <p className="text-foreground/30 font-black tracking-tight">No records found in the vault.</p>
                            </div>
                        ) : transactions.map((tx, i) => (
                            <div key={tx.id} className="glass-morphism rounded-[2.5rem] p-8 hover-lift animate-reveal border-white/40 shadow-sm" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-xl shadow-lg ${tx.credit !== "0" ? 'accent-gradient text-white' : 'bg-foreground/5 opacity-40'}`}>
                                            {tx.credit !== "0" ? '➕' : '➖'}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="font-black text-lg tracking-tight">
                                                {tx.account.user ? `${tx.account.user.firstName} ${tx.account.user.lastName}` : 'System Treasury'}
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{tx.account.accountType}</span>
                                                <span className="text-[10px] font-black text-foreground/20 tracking-tighter font-mono">{tx.id.substring(0, 12)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12 text-right">
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-1">Timestamp</div>
                                            <div className="font-bold text-sm opacity-60">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="min-w-[150px]">
                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-1">Amount</div>
                                            <div className={`text-2xl font-black tracking-tighter ${tx.credit !== "0" ? 'text-secondary' : 'opacity-40'}`}>
                                                {tx.credit !== "0" ? `+ KES ${Number(tx.credit).toLocaleString()}` : `- KES ${Number(tx.debit).toLocaleString()}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
