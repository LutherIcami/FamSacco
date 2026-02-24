'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string;
    status: string;
}

export default function MemberApproval() {
    const router = useRouter();
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>('PENDING');

    useEffect(() => {
        fetchMembers();
    }, [activeTab]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const endpoint = activeTab === 'PENDING' ? '/users/pending' : '/users';
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    router.push('/dashboard');
                    return;
                }
                throw new Error('Failed to fetch members');
            }

            const data = await response.json();
            setMembers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateMemberStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Update failed');

            // Refresh list
            fetchMembers();
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
                        <Link href="/admin/members" className="text-primary transition-colors">Admin: Members</Link>
                        <Link href="/admin/loans" className="hover:text-primary transition-colors">Admin: Loans</Link>
                        <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                    </div>
                </div>
            </nav>

            <main className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
                <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight">Member Management</h1>
                        <p className="text-foreground/40 font-medium font-inter">Approve new family registrations and manage access.</p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setActiveTab('PENDING')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'PENDING' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
                        >
                            Pending Approval
                        </button>
                        <button
                            onClick={() => setActiveTab('ALL')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ALL' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
                        >
                            All Members
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="glass-morphism rounded-3xl overflow-hidden border border-border/50 shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-xs font-black uppercase tracking-widest text-foreground/40">
                                <th className="px-8 py-5">Full Name</th>
                                <th className="px-8 py-5">Contact Details</th>
                                <th className="px-8 py-5">Registered On</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-foreground/20 font-bold">
                                        <span className="animate-pulse">Fetching members...</span>
                                    </td>
                                </tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-foreground/20 font-bold italic">
                                        No {activeTab.toLowerCase()} members found.
                                    </td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-lg">{member.firstName} {member.lastName}</div>
                                            <div className="text-xs text-foreground/40 font-medium">UID: {member.id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-medium">{member.email}</div>
                                            <div className="text-xs text-foreground/40">{member.phone || 'No phone'}</div>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-foreground/60">
                                            {new Date(member.createdAt).toLocaleDateString('en-GB', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${member.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                        member.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                            'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    {member.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {member.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => updateMemberStatus(member.id, 'ACTIVE')}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {member.status === 'ACTIVE' && (
                                                    <button
                                                        onClick={() => updateMemberStatus(member.id, 'SUSPENDED')}
                                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border border-red-500/20"
                                                    >
                                                        Suspend
                                                    </button>
                                                )}
                                                {member.status === 'SUSPENDED' && (
                                                    <button
                                                        onClick={() => updateMemberStatus(member.id, 'ACTIVE')}
                                                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border border-emerald-500/20"
                                                    >
                                                        Reactivate
                                                    </button>
                                                )}
                                            </div>
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
