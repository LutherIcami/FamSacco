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
            {/* Decorative background elements removed */}

            <div className="w-full max-w-md z-10 space-y-8">
                <div className="text-center animate-reveal">
                    <Link href="/" className="text-6xl font-black tracking-tighter hover:scale-105 transition-transform inline-block">
                        Fam<span className="text-primary italic">Sacco</span>
                    </Link>
                </div>

                <div className="bg-white rounded-[3rem] p-12 border border-primary/5 shadow-lg hover-lift animate-reveal [animation-delay:200ms]">
                    <div className="mb-10 text-center">
                        <p className="text-foreground/30 font-black uppercase tracking-[0.3em] text-[10px]">Secure Gateway</p>
                        <h2 className="text-3xl font-black tracking-tighter mt-2">Welcome Back</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4 animate-reveal [animation-delay:400ms]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="your@family.com"
                                    className="w-full px-6 py-4 rounded-2xl bg-foreground/[0.02] border border-foreground/10 focus:border-primary/50 focus:bg-white outline-none transition-all font-bold"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Password</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-6 py-4 rounded-2xl bg-foreground/[0.02] border border-foreground/10 focus:border-primary/50 focus:bg-white outline-none transition-all font-bold"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest leading-loose text-center">
                                {error}
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-5 rounded-2xl premium-gradient text-white font-black text-sm uppercase tracking-[0.2em] shadow-gold animate-reveal [animation-delay:600ms]"
                        >
                            {loading ? 'Authenticating...' : 'Enter Dashboard'}
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
