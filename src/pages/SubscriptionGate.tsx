import { useNavigate } from 'react-router-dom';
import { Lock, Rocket, Shield, Sparkles, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';

export default function SubscriptionGate() {
  const navigate = useNavigate();

  return (
    <div className="circuit-bg relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden px-4 py-20">
      <SEOHead 
        title="Access Restricted — PipFactor" 
        description="Your trial or subscription has expired. Please upgrade to continue accessing premium signals and market intelligence."
        canonical="https://pipfactor.com/subscription-expired"
      />
      
      {/* Decorative background elements */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[40rem] rounded-full bg-[#C8935A]/5 blur-[120px]" />
        <div className="absolute top-0 right-0 h-[30rem] w-[30rem] rounded-full bg-[#E2B485]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="lumina-card relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 text-center border-t-4 border-[#C8935A]/30">
          {/* Status Badge */}
          <div className="mx-auto mb-8 w-fit inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-rose-400 bg-rose-500/10 border border-rose-500/20">
            <Lock className="h-3.5 w-3.5" />
            Access Restricted
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold text-[#E0E0E0] mb-6 leading-tight">
            Your Access has <span className="text-[#E2B485]">Expired</span>
          </h1>

          <p className="text-lg md:text-xl text-[#9CA3AF] mb-10 leading-relaxed max-w-lg mx-auto">
            To continue receiving context-aware market signals and professional trading intelligence, please choose a plan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-[#111315]/50 border border-[#C8935A]/10 rounded-2xl p-5 text-left">
              <Sparkles className="h-6 w-6 text-[#E2B485] mb-3" />
              <h3 className="text-[#E0E0E0] font-semibold mb-1">Premium Signals</h3>
              <p className="text-sm text-[#9CA3AF]">AI-generated ideas across major Forex and Crypto pairs.</p>
            </div>
            <div className="bg-[#111315]/50 border border-[#C8935A]/10 rounded-2xl p-5 text-left">
              <Shield className="h-6 w-6 text-[#C8935A] mb-3" />
              <h3 className="text-[#E0E0E0] font-semibold mb-1">Market Intel</h3>
              <p className="text-sm text-[#9CA3AF]">Regime intelligence and news sentiment analysis.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/pricing')}
              className="lumina-button h-16 w-full sm:w-64 text-lg shadow-[0_20px_50px_rgba(200,147,90,0.2)]"
            >
              <Rocket className="mr-2 h-6 w-6" />
              View Plans
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              onClick={() => navigate('/')}
              className="lumina-button-outline h-16 w-full sm:w-64 text-lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </div>

          <div className="mt-10 pt-8 border-t border-[#C8935A]/10">
            <p className="text-[#9CA3AF] text-sm">
              Need help? <a href="mailto:support@pipfactor.com" className="text-[#E2B485] hover:underline">Contact our support team</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
