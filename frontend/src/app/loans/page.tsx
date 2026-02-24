'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoansPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) router.push('/login');
        else setUser(JSON.parse(storedUser));
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const principal = Number(amount);
            const rate = 1.5; // Fixed family rate
            const total = principal + (principal * (rate / 100));

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ principalAmount: principal, interestRate: rate, totalPayable: total }),
            });

            if (res.ok) {
                setSuccess(true);
                setAmount('');
            } else {
                alert('Application failed. Only active members can apply for loans.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col font-inter">
            <nav className="border-b border-border/50 px-8 py-4 flex justify-between items-center bg-card/30 backdrop-blur-xl sticky top-0 z-50">
                <Link href="/dashboard" className="text-2xl font-black tracking-tight">
                    Fam<span className="text-primary italic">Sacco</span>
                </Link>
                <div className="flex gap-6 text-sm font-semibold text-foreground/60">
                    <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                    <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                    <Link href="/loans" className="text-primary transition-colors">Loans</Link>
                </div>
            </nav>

            <main className="p-8 max-w-4xl mx-auto w-full space-y-12 animate-in fade-in duration-700">
                <section className="text-center space-y-4">
                    <h1 className="text-5xl font-black tracking-tight">Need a boost? 🚀</h1>
                    <p className="text-foreground/40 text-lg font-medium max-w-xl mx-auto">
                        Apply for a family-backed loan at our fixed 1.5% community interest rate.
                    </p>
                </section>

                <div className="glass-morphism rounded-[40px] p-12 border border-white/10 shadow-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-6xl opacity-10">🏦</div>

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="space-y-4 text-center">
                            <label className="text-sm font-black uppercase tracking-widest text-foreground/30">Application Amount</label>
                            <div className="relative max-w-sm mx-auto">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-primary opacity-30">KES</span>
                                <input
                                    required
                                    type="number"
                                    placeholder="0,000"
                                    className="w-full pl-24 pr-8 py-8 text-5xl font-black bg-white/5 rounded-3xl border border-white/5 focus:border-primary/50 outline-none transition-all placeholder:opacity-10 text-center"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                <div className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Interest Rate</div>
                                <div className="text-2xl font-black">1.5% <span className="text-xs text-primary/60 font-medium">FIXED</span></div>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                <div className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Total to Repay</div>
                                <div className="text-2xl font-black text-primary">
                                    KES {amount ? (Number(amount) * 1.015).toLocaleString() : '0.00'}
                                </div>
                            </div>
                        </div>

                        {success ? (
                            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-center space-y-2 animate-bounce">
                                <div className="font-bold text-lg">Application Submitted!</div>
                                <p className="text-sm opacity-80">The family treasurer has been notified for review.</p>
                                <button onClick={() => setSuccess(false)} className="text-xs font-black uppercase tracking-widest mt-4 hover:underline">Apply for another?</button>
                            </div>
                        ) : (
                            <button
                                disabled={loading || !amount}
                                className="w-full py-6 rounded-3xl accent-gradient text-white font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20"
                            >
                                {loading ? 'Processing...' : 'Submit Loan Request'}
                            </button>
                        )}
                    </form>
                </div>

                <section className="bg-white/5 rounded-[40px] p-12 border border-white/10 space-y-6">
                    <h3 className="text-2xl font-black tracking-tight">Your Loan History</h3>
                    <div className="text-center py-12 opacity-30 italic font-medium">
                        No active or past loans found for this account.
                    </div>
                </section>
            </main>
        </div>
    );
}
