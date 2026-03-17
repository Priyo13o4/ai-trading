import { AlertTriangle } from "lucide-react";

const RiskDisclaimer = () => {
  return (
    <section className="relative z-10 py-12 px-4 bg-[#111315] border-t-0 border-b border-[#C8935A]/10">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-[#C8935A]" aria-hidden />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#E2B485]">
              Risk Disclaimer
            </h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Trading forex, gold, and other leveraged instruments involves substantial risk of loss and is not suitable for all investors.
              Past performance is not indicative of future results. PipFactor provides trading signals based on algorithmic analysis,
              but does not guarantee profits or prevent losses. You should carefully consider your financial situation and risk tolerance
              before trading. The high degree of leverage can work against you as well as for you. Signals are educational and analytical
              tools only—all trading decisions remain your sole responsibility.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RiskDisclaimer;
