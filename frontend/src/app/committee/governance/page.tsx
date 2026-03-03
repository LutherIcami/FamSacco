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
            {/* Floating Navigation */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-6">
                <nav className="glass-morphism rounded-full px-8 py-4 flex justify-between items-center bg-white/60 shadow-2xl border border-primary/5">
                    <div className="flex items-center gap-12">
                        <Link href="/dashboard" className="text-2xl font-black tracking-tight hover:scale-105 transition-transform">
                            Fam<span className="text-primary italic">Sacco</span>
                        </Link>
                        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">
                            <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                            <Link href="/committee/governance" className="text-primary">Governance</Link>
                            <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                            <Link href="/loans" className="hover:text-primary transition-colors">Loans</Link>
                        </div>
                    </div>
                </nav>
            </div>

            <div className="h-24"></div>

            <main className="p-8 max-w-5xl mx-auto w-full space-y-12 animate-reveal">
                <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Boardroom</h1>
                        <p className="text-lg text-foreground/40 font-medium italic">Architecting the family's financial future.</p>
                    </div>
                    <div className="px-6 py-3 rounded-full bg-primary/5 border border-primary/10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 anim-pulse">● System Operational</span>
                    </div>
                </section>

                <div className="space-y-10">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-2xl font-black tracking-tighter text-foreground/60">Active Cases</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">Verification Required</p>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center animate-pulse font-black text-foreground/10 text-4xl uppercase tracking-tighter">SYNCING BOARDROOM...</div>
                    ) : loans.length === 0 ? (
                        <div className="glass-morphism rounded-[3rem] p-24 text-center border-dashed border-primary/10">
                            <div className="text-6xl mb-6 opacity-20">📜</div>
                            <h4 className="text-xl font-black tracking-tight text-foreground/30">Clear Docket</h4>
                            <p className="text-sm text-foreground/20 font-medium">No financial requests are awaiting committee judgment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8">
                            {loans.map((loan, i) => (
                                <div key={loan.id} className="bg-white rounded-[3rem] p-10 border border-primary/5 shadow-2xl hover-lift animate-reveal relative overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="flex flex-col md:flex-row gap-10 items-start">
                                        <div className="w-20 h-20 rounded-[1.5rem] premium-gradient flex items-center justify-center text-3xl shadow-gold flex-shrink-0">🏦</div>
                                        <div className="flex-1 space-y-8">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <h2 className="text-4xl font-black tracking-tighter">{loan.user.firstName} {loan.user.lastName}</h2>
                                                    <div className="flex gap-4 items-center">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Major Loan Request</span>
                                                        <span className="text-[10px] font-black text-foreground/20 font-mono tracking-tighter">CASE-{loan.id.substring(0, 8)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-1">Status</p>
                                                    <span className="text-[11px] font-black text-secondary uppercase tracking-[0.2em] px-4 py-2 bg-secondary/10 rounded-full">Pending Vote</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                {[
                                                    { label: 'Principal', value: `KES ${Number(loan.principalAmount).toLocaleString()}` },
                                                    { label: 'Interest Rate', value: `${loan.interestRate}%` },
                                                    { label: 'Total Payable', value: `KES ${Number(loan.totalPayable).toLocaleString()}` },
                                                    { label: 'Quorum', value: `${loan.votes.length} Votes` },
                                                ].map(stat => (
                                                    <div key={stat.label} className="p-6 rounded-[1.5rem] bg-foreground/[0.02] border border-foreground/5 space-y-1">
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30">{stat.label}</p>
                                                        <p className="text-lg font-black tracking-tight">{stat.value}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    disabled={voteLoading === loan.id}
                                                    onClick={() => handleVote(loan.id, 'APPROVE')}
                                                    className="flex-[2] py-5 rounded-2xl gold-gradient text-white font-black text-sm uppercase tracking-widest shadow-gold hover:scale-[1.01] transition-transform disabled:opacity-50"
                                                >
                                                    {voteLoading === loan.id ? 'Processing...' : '✔ Authorize Capital'}
                                                </button>
                                                <button
                                                    disabled={voteLoading === loan.id}
                                                    onClick={() => handleVote(loan.id, 'REJECT')}
                                                    className="flex-1 py-5 rounded-2xl bg-foreground/5 text-foreground/40 font-black text-xs uppercase tracking-widest hover:bg-foreground/10 transition-colors disabled:opacity-50"
                                                >
                                                    ✘ Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
