'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ReviewLoan {
    id: string;
    principalAmount: string;
    interestRate: string;
    totalPayable: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    votes: any[];
}

export default function GovernancePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loans, setLoans] = useState<ReviewLoan[]>([]);
    const [loading, setLoading] = useState(true);
    const [voteLoading, setVoteLoading] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');

        if (!storedUser || !token) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        const canReview = parsedUser.roles?.some((r: string) => ['super_admin', 'treasurer', 'committee'].includes(r));
        if (!canReview) {
            router.push('/dashboard');
            return;
        }

        setUser(parsedUser);
        fetchQueue(token);
    }, [router]);

    const fetchQueue = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/governance/review-queue`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setLoans(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (loanId: string, vote: 'APPROVE' | 'REJECT') => {
        const token = localStorage.getItem('access_token');
        setVoteLoading(loanId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/governance/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ loanId, vote, comment: 'Voted via Governance Portal' })
            });

            if (res.ok) {
                fetchQueue(token!);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to submit vote');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setVoteLoading(null);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col font-inter">
            <nav className="border-b border-border/50 px-8 py-4 flex justify-between items-center bg-card/30 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-2xl font-black tracking-tight">
                        Fam<span className="text-primary italic">Sacco</span>
                    </Link>
                    <div className="flex gap-6 text-sm font-semibold text-foreground/60">
                        <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                        <Link href="/committee/governance" className="text-primary transition-colors">Governance</Link>
                        <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                    </div>
                </div>
            </nav>

            <main className="p-8 max-w-5xl mx-auto w-full space-y-12 animate-in fade-in duration-700">
                <section className="space-y-4 text-center">
                    <h1 className="text-5xl font-black tracking-tight">Governance Portal 🏛️</h1>
                    <p className="text-foreground/40 text-lg font-medium">As a Committee Member, your vote ensures the Sacco's sustainability for large financial requests.</p>
                </section>

                <div className="space-y-6">
                    {loading ? (
                        <div className="py-20 text-center animate-pulse font-bold opacity-20 text-2xl uppercase tracking-widest">Scanning Boardroom...</div>
                    ) : loans.length === 0 ? (
                        <div className="glass-morphism rounded-3xl p-16 text-center border border-dashed border-foreground/10 space-y-4">
                            <div className="text-5xl text-foreground/10">🌳</div>
                            <div className="text-xl font-bold opacity-30">The Review Queue is Clear.</div>
                            <p className="text-foreground/20 text-sm">No large loan requests are pending committee approval at this time.</p>
                        </div>
                    ) : (
                        loans.map((loan) => (
                            <div key={loan.id} className="glass-morphism rounded-[2.5rem] p-10 border border-foreground/10 relative overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl">
                                <div className="absolute top-0 right-0 p-8">
                                    <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 shadow-lg">Pending Board Review</span>
                                </div>

                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="w-16 h-16 rounded-2xl premium-gradient flex items-center justify-center text-3xl shadow-xl flex-shrink-0">📜</div>
                                    <div className="space-y-6 flex-1">
                                        <div>
                                            <h2 className="text-2xl font-black">{loan.user.firstName} {loan.user.lastName}</h2>
                                            <p className="text-foreground/40 text-sm font-medium">Requesting KES {Number(loan.principalAmount).toLocaleString()} for expansion.</p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
                                                <div className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Principal</div>
                                                <div className="font-bold text-lg">KES {Number(loan.principalAmount).toLocaleString()}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
                                                <div className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Rate</div>
                                                <div className="font-bold text-lg">{loan.interestRate}%</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
                                                <div className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Total Due</div>
                                                <div className="font-bold text-lg">KES {Number(loan.totalPayable).toLocaleString()}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
                                                <div className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">Current Votes</div>
                                                <div className="font-bold text-lg">{loan.votes.length} cast</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                disabled={voteLoading === loan.id}
                                                onClick={() => handleVote(loan.id, 'APPROVE')}
                                                className="flex-1 py-4 rounded-2xl savings-gradient text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                            >
                                                {voteLoading === loan.id ? 'Casting...' : '✓ Approve Request'}
                                            </button>
                                            <button
                                                disabled={voteLoading === loan.id}
                                                onClick={() => handleVote(loan.id, 'REJECT')}
                                                className="flex-1 py-4 rounded-2xl bg-foreground/5 font-black text-sm uppercase tracking-widest hover:bg-foreground/10 transition-all border border-foreground/5 disabled:opacity-50"
                                            >
                                                ✗ Reject & Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
