'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Loan {
    id: string;
    principalAmount: string;
    interestRate: string;
    totalPayable: string;
    status: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

export default function LoanApproval() {
    const router = useRouter();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    router.push('/dashboard');
                    return;
                }
                throw new Error('Failed to fetch loan requests');
            }

            const data = await response.json();
            setLoans(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateLoanStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'DISBURSED') => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Update failed');

            fetchLoans();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Navigation */}
            <nav className="border-b border-border/50 px-8 py-4 flex justify-between items-center bg-card/30 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-2xl font-black tracking-tight">
                        Fam<span className="text-primary italic">Sacco</span>
                    </Link>
                    <div className="flex gap-6 text-sm font-semibold text-foreground/60">
                        <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                        <Link href="/admin/members" className="hover:text-primary transition-colors">Admin: Members</Link>
                        <Link href="/admin/loans" className="text-primary transition-colors">Admin: Loans</Link>
                        <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                    </div>
                </div>
            </nav>

            <main className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
                <section className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight">Loan Approval Queue</h1>
                    <p className="text-foreground/40 font-medium">Review and process family loan requests based on pool availability.</p>
                </section>

                {error && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        <div className="glass-morphism rounded-3xl p-20 text-center text-foreground/20 font-bold animate-pulse">
                            Loading requests...
                        </div>
                    ) : loans.length === 0 ? (
                        <div className="glass-morphism rounded-3xl p-20 text-center text-foreground/20 font-bold italic">
                            No pending loan requests found.
                        </div>
                    ) : (
                        loans.map((loan) => (
                            <div key={loan.id} className="glass-morphism rounded-3xl p-8 border border-border/50 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center text-3xl shadow-lg">
                                        💸
                                    </div>
                                    <div>
                                        <div className="text-xl font-black">{loan.user.firstName} {loan.user.lastName}</div>
                                        <div className="text-sm text-foreground/40 font-medium">{loan.user.email}</div>
                                        <div className="text-xs text-primary font-bold mt-1 uppercase tracking-widest">Requested on {new Date(loan.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="flex gap-12 text-center">
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">Principal</div>
                                        <div className="text-xl font-black">KES {Number(loan.principalAmount).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">Rate</div>
                                        <div className="text-xl font-black">{loan.interestRate}%</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">Total Due</div>
                                        <div className="text-xl font-black text-primary">KES {Number(loan.totalPayable).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => updateLoanStatus(loan.id, 'REJECTED')}
                                        className="flex-1 md:flex-none border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => updateLoanStatus(loan.id, 'APPROVED')}
                                        className="flex-1 md:flex-none accent-gradient text-white text-xs font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
                                    >
                                        Approve Loan
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
