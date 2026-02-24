import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background selection:bg-primary/20">
      <main className="max-w-6xl w-full flex flex-col items-center text-center space-y-16">
        {/* Decorative background elements */}
        <div className="fixed top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="fixed bottom-0 -right-4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] -z-10"></div>

        {/* Hero Section */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-block px-6 py-2 mb-4 text-xs font-black tracking-[0.2em] text-white uppercase premium-gradient rounded-full shadow-xl shadow-primary/20">
            Family Wealth Refined
          </div>
          <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-[0.85] text-foreground drop-shadow-sm">
            Fam<span className="text-primary italic">Sacco</span>
          </h1>
          <p className="text-xl md:text-3xl text-foreground/60 max-w-2xl mx-auto leading-tight font-medium">
            Building generational wealth, <span className="text-secondary font-black">together</span>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center animate-in fade-in zoom-in duration-1000 delay-300">
          <Link
            href="/register"
            className="px-12 py-5 rounded-[2rem] premium-gradient text-white font-black text-xl hover:scale-105 hover:rotate-1 active:scale-95 transition-all shadow-2xl shadow-primary/30"
          >
            Start Our Journey
          </Link>
          <Link
            href="/login"
            className="px-12 py-5 rounded-[2rem] glass-morphism border border-border/50 font-black text-xl hover:bg-white/5 transition-all flex items-center gap-2"
          >
            Member Login 👤
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 animate-in fade-in duration-1000 delay-500">
          <div className="p-10 rounded-[2.5rem] glass-morphism border border-border/50 text-left space-y-6 hover:translate-y-[-8px] transition-all group">
            <div className="w-16 h-16 rounded-2xl savings-gradient flex items-center justify-center text-3xl shadow-lg ring-4 ring-white/5">💰</div>
            <h3 className="text-2xl font-black tracking-tight">Vault Secure</h3>
            <p className="text-foreground/50 font-medium leading-relaxed">
              Real-time double-entry accounting keeps your family's savings safe and transparent.
            </p>
          </div>
          <div className="p-10 rounded-[2.5rem] glass-morphism border border-border/50 text-left space-y-6 hover:translate-y-[-8px] transition-all group">
            <div className="w-16 h-16 rounded-2xl premium-gradient flex items-center justify-center text-3xl shadow-lg ring-4 ring-white/5">🚀</div>
            <h3 className="text-2xl font-black tracking-tight">Smart Growth</h3>
            <p className="text-foreground/50 font-medium leading-relaxed">
              Unlock family potential with low-interest loans and collective investment power.
            </p>
          </div>
          <div className="p-10 rounded-[2.5rem] glass-morphism border border-border/50 text-left space-y-6 hover:translate-y-[-8px] transition-all group">
            <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center text-3xl shadow-lg ring-4 ring-white/5">🏠</div>
            <h3 className="text-2xl font-black tracking-tight">Family Core</h3>
            <p className="text-foreground/50 font-medium leading-relaxed">
              More than banking. A social wall to share milestones and build a shared legacy.
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-24 pb-12 text-xs font-black uppercase tracking-[0.3em] text-foreground/20">
        &copy; 2026 FamSacco &bull; Banking on Love
      </footer>
    </div>
  );
}
