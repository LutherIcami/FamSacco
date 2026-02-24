'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden font-inter text-foreground">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] animate-pulse"></div>

            <div className="w-full max-w-lg z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="glass-morphism rounded-[2.5rem] p-12 border border-white/10 shadow-3xl">
                    <div className="flex flex-col items-center mb-10 space-y-4">
                        <Link href="/" className="text-5xl font-black tracking-tighter">
                            Fam<span className="text-primary italic">Sacco</span>
                        </Link>
                        <p className="text-foreground/40 font-black uppercase tracking-[0.2em] text-xs">Create your family banking account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">First Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="John"
                                    className="w-full px-6 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary/50 outline-none transition-all font-bold"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Last Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Doe"
                                    className="w-full px-6 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary/50 outline-none transition-all font-bold"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>

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
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Phone Number (Optional)</label>
                            <input
                                type="tel"
                                placeholder="+254 7XX XXX XXX"
                                className="w-full px-6 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary/50 outline-none transition-all font-bold"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Password</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-6 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary/50 outline-none transition-all font-bold"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Confirm</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-6 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary/50 outline-none transition-all font-bold"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest leading-loose text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-5 rounded-2xl premium-gradient text-white font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-primary/30 mt-4"
                        >
                            {loading ? 'Creating Account...' : 'Continue to Dashboard'}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <span className="text-foreground/40 text-[10px] font-black uppercase tracking-widest">Already have an account? </span>
                        <Link href="/login" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                            Log in instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
