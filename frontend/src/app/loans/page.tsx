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
            {/* Floating Navigation */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-6">
                <nav className="glass-morphism rounded-full px-8 py-4 flex justify-between items-center bg-white/60 shadow-2xl border border-primary/5">
                    <div className="flex items-center gap-12">
                        <Link href="/dashboard" className="text-2xl font-black tracking-tight hover:scale-105 transition-transform">
                            Fam<span className="text-primary italic">Sacco</span>
                        </Link>
                        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">
                            <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                            <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                            <Link href="/loans" className="text-primary">Loans</Link>
                            <Link href="/social" className="hover:text-primary transition-colors">Social</Link>
                        </div>
                    </div>
                </nav>
            </div>

            <div className="h-24"></div>

            <main className="p-8 max-w-5xl mx-auto w-full space-y-12 animate-reveal">
                <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Growth Credit</h1>
                        <p className="text-lg text-foreground/40 font-medium">Empowering your family endeavors.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 mb-1">Current Interest Rate</p>
                        <div className="text-3xl font-black text-secondary tracking-tighter">1.5% <span className="text-sm opacity-30 font-medium tracking-tight italic">fixed AR</span></div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Panel: Limit Visualization */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="glass-morphism rounded-[3rem] p-10 space-y-8 hover-lift">
                            <div className="space-y-2">
                                <h3 className="text-xl font-black tracking-tight text-foreground/60">Your Liquidity</h3>
                                <p className="text-xs text-foreground/30 font-bold uppercase tracking-widest">Available Credit</p>
                            </div>

                            <div className="relative aspect-square flex items-center justify-center p-4">
                                <div className="absolute inset-0 border-[16px] border-primary/5 rounded-full"></div>
                                <div className="absolute inset-0 border-[16px] border-secondary border-l-transparent border-b-transparent rounded-full rotate-45"></div>
                                <div className="text-center">
                                    <div className="text-xs font-black uppercase tracking-widest text-foreground/20">Up to</div>
                                    <div className="text-3xl font-black tracking-tighter">3x</div>
                                    <div className="text-[10px] font-bold text-foreground/40">OF SAVINGS</div>
                                </div>
                            </div>

                            <p className="text-[10px] text-center text-foreground/40 leading-relaxed font-semibold">
                                Loan limits are proportionally calculated based on your total savings and family verification status.
                            </p>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-foreground/5 border border-foreground/5 space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-widest">Recent Activity</h4>
                            <p className="text-xs text-foreground/30 italic">No loan history under this account.</p>
                        </div>
                    </div>

                    {/* Right Panel: Application Form */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-[4rem] p-12 border border-primary/5 shadow-2xl hover-lift">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-4 text-center">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20">Application Amount</label>
                                    <div className="relative max-w-sm mx-auto group">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-5xl font-black text-foreground/10 transition-colors group-focus-within:text-primary/20">KES</span>
                                        <input
                                            required
                                            type="number"
                                            placeholder="0,000"
                                            className="w-full pl-32 pr-4 py-8 text-6xl font-black bg-transparent border-b-4 border-foreground/5 focus:border-primary/50 outline-none transition-all placeholder:text-foreground/5 text-right tracking-tighter"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 text-center">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Lending Term</p>
                                        <p className="text-xl font-black">Flexible</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Repayable Total</p>
                                        <p className="text-2xl font-black text-secondary tracking-tighter">
                                            KES {amount ? (Number(amount) * 1.015).toLocaleString() : '0.00'}
                                        </p>
                                    </div>
                                </div>

                                {success ? (
                                    <div className="p-8 rounded-[3rem] bg-secondary/10 border border-secondary/20 text-secondary text-center space-y-3 animate-reveal">
                                        <div className="text-4xl">🚀</div>
                                        <div className="font-black text-xl tracking-tight">Request Broadcasted</div>
                                        <p className="text-sm opacity-60 font-medium">The family pool has been notified for verification.</p>
                                        <button onClick={() => setSuccess(false)} className="text-[10px] font-black uppercase tracking-[0.2em] pt-4 hover:underline">Apply Again</button>
                                    </div>
                                ) : (
                                    <button
                                        disabled={loading || !amount}
                                        className="w-full py-7 rounded-[2rem] premium-gradient text-white font-black text-sm uppercase tracking-[0.3em] shadow-gold hover:scale-[1.01] transition-transform disabled:opacity-20"
                                    >
                                        {loading ? 'Processing...' : 'Apply for Wealth'}
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
