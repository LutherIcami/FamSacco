'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden font-inter">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] animate-pulse"></div>

            <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="glass-morphism rounded-[2.5rem] p-12 border border-white/10 shadow-3xl">
                    <div className="flex flex-col items-center mb-10 space-y-4">
                        <Link href="/" className="text-5xl font-black tracking-tighter">
                            Fam<span className="text-primary italic">Sacco</span>
                        </Link>
                        <p className="text-foreground/40 font-black uppercase tracking-[0.2em] text-xs">Welcome back to the family</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Email Address</label>
                            <input
                                required
                                type="email"
                                placeholder="john@family.com"
                                className="w-full px-6 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary/50 outline-none transition-all font-bold"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Password</label>
                                <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                required
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-6 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary/50 outline-none transition-all font-bold"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest leading-loose text-center">
                                {error}
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-5 rounded-2xl premium-gradient text-white font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-primary/30"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <span className="text-foreground/40 text-[10px] font-black uppercase tracking-widest">New to FamSacco? </span>
                        <Link href="/register" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                            Join the family
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
