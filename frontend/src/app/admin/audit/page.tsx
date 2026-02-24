'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

export default function AuditLogsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');

        if (!storedUser || !token) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.roles?.includes('super_admin')) {
            router.push('/dashboard');
            return;
        }

        setUser(parsedUser);
        fetchLogs(token);
    }, [router]);

    const fetchLogs = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/audit/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setLogs(await res.json());
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
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-2xl font-black tracking-tight">
                        Fam<span className="text-primary italic">Sacco</span>
                    </Link>
                    <div className="flex gap-6 text-sm font-semibold text-foreground/60">
                        <Link href="/dashboard" className="hover:text-primary transition-colors">Overview</Link>
                        <Link href="/admin/members" className="hover:text-primary transition-colors">Members</Link>
                        <Link href="/finance" className="hover:text-primary transition-colors">Ledger</Link>
                        <Link href="/admin/audit" className="text-primary transition-colors">Audit Logs</Link>
                    </div>
                </div>
            </nav>

            <main className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
                <section className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">System Audit Logs 🛡️</h1>
                    <p className="text-foreground/40 font-medium font-inter">Immutable record of every critical action performed in FamSacco.</p>
                </section>

                <div className="glass-morphism rounded-3xl overflow-hidden border border-border/50 shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-foreground/5 border-b border-foreground/10 text-xs font-black uppercase tracking-widest text-foreground/40">
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5">Administrator</th>
                                <th className="px-8 py-5">Action</th>
                                <th className="px-8 py-5">Entity</th>
                                <th className="px-8 py-5">Reference ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/5">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center animate-pulse font-bold opacity-20 text-sm">Loading Security Logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} className="py-20 text-center italic font-bold opacity-20 text-sm">No audit logs recorded yet.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-foreground/5 transition-colors">
                                        <td className="px-8 py-5 text-sm text-foreground/60">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-sm">{log.user.firstName} {log.user.lastName}</div>
                                            <div className="text-[10px] text-foreground/30 font-black uppercase tracking-widest">{log.user.email}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${log.action.includes('DEPOSIT') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    log.action.includes('LOAN') ? 'bg-primary/10 text-primary border-primary/20' :
                                                        'bg-foreground/10 text-foreground/50 border-foreground/10'
                                                }`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold opacity-60 uppercase tracking-tighter">
                                            {log.entityType}
                                        </td>
                                        <td className="px-8 py-5 font-mono text-xs opacity-30">
                                            #{log.entityId.substring(0, 12)}...
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
