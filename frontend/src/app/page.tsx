import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background selection:bg-primary/20">
      <main className="max-w-6xl w-full flex flex-col items-center text-center space-y-16">
        {/* Decorative background elements removed to maintain pure white background */}

        {/* Hero Section */}
        <div className="space-y-10 animate-reveal">
          <div className="inline-block px-8 py-2.5 mb-4 text-[10px] font-black uppercase tracking-[0.4em] text-white premium-gradient rounded-full shadow-gold floating">
            Family Wealth Refined
          </div>
          <h1 className="text-8xl md:text-[12rem] font-black tracking-tighter leading-[0.8] text-foreground drop-shadow-2xl">
            Fam<span className="text-primary italic">Sacco</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/50 max-w-2xl mx-auto leading-relaxed font-medium">
            Building generational wealth with the <span className="text-secondary font-black underline decoration-primary/20 decoration-4 underline-offset-8">prestige</span> your family deserves.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center animate-reveal [animation-delay:200ms]">
          <Link
            href="/register"
            className="px-14 py-6 rounded-full premium-gradient text-white font-black text-xl hover-lift shadow-gold"
          >
            Start Our Journey
          </Link>
          <Link
            href="/login"
            className="px-14 py-6 rounded-full glass-morphism border border-primary/10 font-black text-xl hover-lift flex items-center gap-2"
          >
            Member Login 👤
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-20 animate-reveal [animation-delay:400ms]">
          {[
            { icon: '💰', title: 'Vault Secure', desc: "Real-time double-entry accounting keeps your family's savings safe and transparent.", grad: 'savings-gradient' },
            { icon: '🚀', title: 'Smart Growth', desc: 'Unlock family potential with low-interest loans and collective investment power.', grad: 'premium-gradient' },
            { icon: '🏠', title: 'Family Core', desc: 'More than banking. A social wall to share milestones and build a shared legacy.', grad: 'gold-gradient' }
          ].map((feat, i) => (
            <div key={i} className="p-12 rounded-[3.5rem] bg-white border border-primary/5 text-left space-y-6 hover-lift group">
              <div className={`w-16 h-16 rounded-2xl ${feat.grad} flex items-center justify-center text-3xl shadow-xl ring-4 ring-white/5 group-hover:rotate-12 transition-transform`}>{feat.icon}</div>
              <h3 className="text-2xl font-black tracking-tight">{feat.title}</h3>
              <p className="text-foreground/40 font-medium leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-24 pb-12 text-xs font-black uppercase tracking-[0.3em] text-foreground/20">
        &copy; 2026 FamSacco &bull; Banking on Love
      </footer>
    </div>
  );
}
