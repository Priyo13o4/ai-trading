import React from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Mail, Globe2, Cpu, BarChart3, ShieldAlert, CheckCircle2 } from 'lucide-react';
import RiskDisclaimer from '@/components/marketing/RiskDisclaimer';

const About = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PipFactor",
    foundingLocation: "India",
    url: import.meta.env.VITE_PUBLIC_APP_URL,
    logo: {
      "@type": "ImageObject",
      url: `https://cdn.pipfactor.com/website-assets/pipfactor.svg`,
      width: "512",
      height: "512",
    },
    description: "PipFactor is an AI-powered trading signal platform that continuously analyzes price structure, volatility, and economic events.",
  };

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "PipFactor Founder",
    jobTitle: "Founder & CEO",
    worksFor: {
      "@type": "Organization",
      name: "PipFactor"
    }
  };

  return (
    <div className="circuit-bg relative overflow-hidden min-h-screen text-white pb-20">
      <div className="relative z-10">
        <SEOHead 
        title="About PipFactor — AI Trading Signal Platform Built in India"
        description="PipFactor was built in India for global traders. Learn how our AI-powered trading signals work, our methodology, and why we built it."
        canonical={`${import.meta.env.VITE_PUBLIC_APP_URL}/about`}
        structuredData={[organizationSchema, personSchema]}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{
          background: "radial-gradient(circle at 50% -20%, rgba(200, 147, 90, 0.15), transparent 70%)"
        }} />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
            Built by a trader who got <span className="text-[#E2B485]">burned</span> — so you don't have to.
          </h1>
          <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
            PipFactor is an AI-powered trading intelligence system that connects real-world news to real market behaviour. No gut feelings. No gurus. Just context.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-display font-bold text-white mb-8 border-b border-[#C8935A]/20 pb-4">Our Story</h2>
          <div className="prose prose-invert prose-lg max-w-none text-[#9CA3AF]">
            <p>
              About a year ago, I was trading Gold (XAUUSD) and losing money — not because I was a bad trader. I had years of experience. I understood structure, EMAs, pivot points. I knew how to read a chart.
            </p>
            <p className="font-semibold text-white">The problem was news.</p>
            <p>
              Trump would say something about tariffs. A central bank would make an unplanned statement. In minutes, the market would blow straight through every level I had mapped out — pivots, supports, EMAs — all gone. And I'd just sit there, holding the trade, watching it break, struggling to let go. Because on the chart, the setup still <em>looked</em> right.
            </p>
            <p>
              That's the thing nobody talks about enough: <strong>knowing the rules doesn't help if you can't understand why the market is suddenly ignoring them.</strong> News was the missing context. And I had no system to process it fast enough.
            </p>
            <p>
              I started asking a different question: what if I didn't have to manually connect those dots? What if a system could watch the news, analyse the market structure, and tell me — <em>right now</em> — whether this setup still makes sense?
            </p>
          </div>
        </div>
      </section>

      {/* How It Started */}
      <section className="py-16 px-4 bg-[#111315]/40">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-display font-bold text-white mb-8 border-b border-[#C8935A]/20 pb-4">How It Started</h2>
          <div className="prose prose-invert prose-lg max-w-none text-[#9CA3AF]">
            <p>
              I started experimenting with n8n workflows and ChatGPT to sketch out an architecture. The idea that came back was a three-engine system:
            </p>
            <ul className="space-y-4 my-8">
              <li className="flex gap-4">
                <span className="text-[#E2B485] font-bold">01.</span>
                <span>A <strong>News Engine</strong> — scanning and scoring global financial news as it breaks</span>
              </li>
              <li className="flex gap-4">
                <span className="text-[#E2B485] font-bold">02.</span>
                <span>A <strong>Regime Engine</strong> — reading the current market structure, without any news bias</span>
              </li>
              <li className="flex gap-4">
                <span className="text-[#E2B485] font-bold">03.</span>
                <span>A <strong>Strategy Engine</strong> — combining both, and generating actual trade setups</span>
              </li>
            </ul>
            <p>
              At first I wired this up to a Telegram channel. It worked, but it felt shallow. Users couldn't really understand <em>why</em> a signal was generated, or what the market was doing underneath it. That's when I decided to build a proper platform — a full-stack web app where traders could see the context behind every signal, not just the entry and exit.
            </p>
            <p>That became PipFactor.</p>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-8">Who This Is For</h2>
          <p className="text-lg text-[#9CA3AF] leading-relaxed max-w-2xl mx-auto">
            I built this for the trader I was a year ago. If you're part-time, if you're newer to forex or commodities, if you've ever held a losing trade too long because the chart <em>seemed</em> fine until it wasn't — this is for you. The goal isn't to replace your judgment. It's to give you the context that takes minutes or hours to build manually, in seconds.
          </p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 px-4 bg-[#111315]/60 border-y border-[#C8935A]/10">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-display font-bold text-white mb-8 border-b border-[#C8935A]/20 pb-4">Who Built This</h2>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[#C8935A]/20 flex items-center justify-center shrink-0 border border-[#C8935A]/30">
              <span className="text-[#E2B485] font-bold text-2xl">P</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Priyodip</h3>
              <p className="text-sm text-[#C8935A] mb-4 uppercase tracking-wider">Founder &amp; Lead Engineer</p>
              <p className="text-[#9CA3AF] leading-relaxed text-lg">
                I'm a trader-turned-engineer based in Bangalore, India. I've spent years in retail Forex and commodities markets, and more years building software. PipFactor is the point where those two things collided. It's not a product I built to sell a dream — it's a tool I built because I needed it myself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-20 px-4 bg-[#111315]/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-display font-bold text-center text-white mb-16">How PipFactor Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="lumina-card p-8 rounded-2xl border border-[#C8935A]/20 bg-[#111315]/50">
              <div className="w-12 h-12 rounded-xl bg-[#C8935A]/10 flex items-center justify-center text-[#E2B485] mb-6 border border-[#C8935A]/30">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">News Intelligence Layer</h3>
              <p className="text-[#9CA3AF] leading-relaxed text-sm">
                Continuously monitors global financial news, scoring every article for genuine market impact. Most news gets filtered out immediately — political noise, routine data, and information already priced into the market never reach the analysis layer. Only events with a clear, explainable causal link to a specific instrument, and a meaningful element of surprise, make it through.
              </p>
            </div>
            
            <div className="lumina-card p-8 rounded-2xl border border-[#C8935A]/20 bg-[#111315]/50">
              <div className="w-12 h-12 rounded-xl bg-[#C8935A]/10 flex items-center justify-center text-[#E2B485] mb-6 border border-[#C8935A]/30">
                <Cpu size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Regime Engine</h3>
              <p className="text-[#9CA3AF] leading-relaxed text-sm">
                Independently reads market structure across six timeframes — from weekly down to 5-minute — without news bias. It classifies the market into seven states: Trending Bull, Trending Bear, Ranging, Volatile, Consolidation, Breakout, or Choppy. A key design rule: a market that looks bullish on the weekly but is compressing on lower timeframes is never mislabelled as Trending.
              </p>
            </div>
            
            <div className="lumina-card p-8 rounded-2xl border border-[#C8935A]/20 bg-[#111315]/50">
              <div className="w-12 h-12 rounded-xl bg-[#C8935A]/10 flex items-center justify-center text-[#E2B485] mb-6 border border-[#C8935A]/30">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Strategy Engine</h3>
              <p className="text-[#9CA3AF] leading-relaxed text-sm">
                Combines regime context, news intelligence, and the weekly playbook into a single decision. Before generating a signal, it checks if a technical setup actually exists — news alone can never manufacture a trade direction price doesn't support. When high-impact news is imminent, automated execution is blocked and signals are flagged for manual review only.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="inline-flex items-center gap-2 text-sm text-[#E2B485] bg-[#E2B485]/10 px-4 py-2 rounded-full border border-[#C8935A]/20">
              <ShieldAlert size={16} />
              Signals are AI-generated analysis for informational purposes only — not regulated financial advice.
            </p>
          </div>
        </div>
      </section>

      {/* What We Support */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-10">What We Support</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="lumina-card p-8 rounded-2xl border border-[#C8935A]/20 bg-[#111315]">
              <h3 className="text-xl font-bold text-[#E2B485] mb-6">Supported Assets</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="text-emerald-500" size={18} /> Major Forex (EURUSD, GBPUSD, USDJPY)</li>
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="text-emerald-500" size={18} /> Commodities (Gold / XAUUSD)</li>
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="text-emerald-500" size={18} /> Cryptocurrencies (BTCUSD)</li>
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="text-emerald-500" size={18} /> 40+ Technical Indicators monitored</li>
              </ul>
            </div>
            
            <div className="lumina-card p-8 rounded-2xl border border-[#C8935A]/20 bg-[#111315]">
              <h3 className="text-xl font-bold text-[#E2B485] mb-6">Delivery Channels</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="text-emerald-500" size={18} /> Secure Web Dashboard</li>
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="text-emerald-500" size={18} /> Instant Telegram Alerts</li>
                <li className="flex items-center gap-3 text-white opacity-50"><CheckCircle2 className="text-emerald-500" size={18} /> Webhooks (Coming Soon)</li>
                <li className="flex items-center gap-3 text-white opacity-50"><CheckCircle2 className="text-emerald-500" size={18} /> Direct MT4/MT5 Integration (Planned)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-[#111315]/80">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C8935A]/20 flex items-center justify-center text-[#E2B485] mx-auto mb-6 shadow-lg shadow-[#C8935A]/10">
            <Mail size={32} />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-6">Get in Touch</h2>
          <p className="text-lg text-[#9CA3AF] mb-6">
            For support, partnership, or press enquiries, please reach out to us via email.
          </p>
          <a href="mailto:support@pipfactor.com" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-white text-black hover:bg-gray-200 transition-colors shadow-lg">
            support@pipfactor.com
          </a>
        </div>
      </section>

      {/* Extended Legal Disclaimer */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-[#1a1d21] border border-[#C8935A]/20 p-8 md:p-10 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="text-[#E2B485] shrink-0" size={28} />
              <h2 className="text-2xl font-bold text-white">Regulatory & Legal Disclaimer</h2>
            </div>
            <div className="space-y-4 text-sm text-[#9CA3AF] leading-relaxed">
              <p>
                PipFactor provides AI-generated trading signals, market analysis, and educational content for informational purposes only. We are a software-as-a-service (SaaS) provider and are <strong>not a registered broker, financial advisor, or investment firm</strong>.
              </p>
              <p>
                <strong>Not Regulated:</strong> PipFactor is not registered with or regulated by the U.S. Securities and Exchange Commission (SEC), the Financial Conduct Authority (FCA), the Securities and Exchange Board of India (SEBI), or any other financial regulatory body. Our services do not constitute regulated financial activities or investment advice.
              </p>
              <p>
                <strong>High Risk Investment:</strong> Trading foreign exchange on margin, cryptocurrencies, and other financial instruments carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you. You could sustain a loss of some or all of your initial investment; therefore, you should not invest money that you cannot afford to lose.
              </p>
              <p>
                Past performance is not indicative of future results. You alone are responsible for evaluating the merits and risks associated with the use of our platform. By using PipFactor, you agree not to hold us liable for any possible claim for damages arising from any decision you make based on information made available through our services.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
);
};

export default About;
