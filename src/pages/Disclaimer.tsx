import React from 'react';
import { SEOHead } from '@/components/SEOHead';

const Disclaimer = () => {
  return (
    <div className="circuit-bg relative overflow-hidden min-h-screen text-white pt-24 pb-16">
      <div className="relative z-10">
        <SEOHead 
          title="Risk Disclaimer | PipFactor"
          description="Risk disclaimer and limitation of liability for using PipFactor's AI trading signals."
          canonical="https://pipfactor.com/disclaimer"
        />
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-[#1a1d21] border border-[#C8935A]/20 p-8 md:p-12 rounded-2xl shadow-xl">
            <div className="flex items-center gap-6 mb-8">
              <div className="h-16 w-16 shrink-0">
                <img 
                  src="https://cdn.pipfactor.com/website-assets/pipfactor.svg" 
                  alt="PipFactor" 
                  className="h-full w-full object-contain"
                  style={{ filter: 'brightness(0) saturate(100%) invert(86%) sepia(21%) saturate(940%) hue-rotate(338deg) brightness(88%) contrast(92%)' }} 
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Risk Disclaimer</h1>
                <p className="text-[#9CA3AF]">Last updated May 09, 2026</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none text-[#9CA3AF] space-y-6">
              <p className="text-lg text-white font-medium">
                Trading foreign exchange, cryptocurrencies, and other financial instruments carries a high level of risk and may not be suitable for all investors.
              </p>

              <h2 className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">1. General Information Only</h2>
              <p>
                PipFactor provides AI-generated trading signals, market analysis, and educational content for informational and educational purposes only. We are not a registered broker, financial advisor, or investment firm. The information provided on our platform does not constitute financial advice, investment recommendations, or an offer to buy or sell any financial instruments.
              </p>

              <h2 className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">2. High Risk Warning</h2>
              <p>
                Before deciding to participate in the financial markets, you should carefully consider your investment objectives, level of experience, and risk appetite. The high degree of leverage can work against you as well as for you. There is a possibility that you could sustain a loss of some or all of your initial investment and therefore you should not invest money that you cannot afford to lose.
              </p>

              <h2 className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">3. No Guarantee of Accuracy</h2>
              <p>
                While PipFactor uses advanced artificial intelligence and quantitative models to generate signals, market conditions change rapidly and unpredictably. We make no representations, warranties, or guarantees regarding the accuracy, completeness, or timeliness of our signals. Past performance of any trading system or methodology is not necessarily indicative of future results.
              </p>

              <h2 className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">4. User Responsibility</h2>
              <p>
                You alone are responsible for evaluating the merits and risks associated with the use of our services. You agree not to hold PipFactor, its affiliates, employees, or directors liable for any possible claim for damages arising from any decision you make based on information made available through our platform.
              </p>

              <h2 className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">5. Regulatory Status</h2>
              <p>
                PipFactor is not registered with the U.S. Securities and Exchange Commission (SEC), the Financial Conduct Authority (FCA), the Securities and Exchange Board of India (SEBI), or any other regulatory body. Our services are provided globally as software-as-a-service (SaaS) and do not constitute regulated financial activities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
