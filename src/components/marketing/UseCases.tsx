import { Clock, TrendingUp, Briefcase } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";

const useCases = [
  {
    icon: <Clock className="h-8 w-8 text-brand" aria-hidden />,
    title: "Part-Time Traders",
    desc: "Can't watch charts all day? PipFactor monitors markets 24/7 so you don't miss opportunities.",
    benefit: "Trade confidently with a full-time job",
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-brand" aria-hidden />,
    title: "Active Day Traders",
    desc: "Get confirmation for your analysis with AI-generated confidence scores and structured risk levels.",
    benefit: "Validate your strategies with data",
  },
  {
    icon: <Briefcase className="h-8 w-8 text-brand" aria-hidden />,
    title: "Systematic Traders",
    desc: "Machine-readable signal format integrates seamlessly into your automated trading systems.",
    benefit: "API-ready structured outputs",
  },
] as const;

const UseCases = () => {
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const rotateX = (y - 0.5) * 10; // -5 to 5 degrees
    const rotateY = (x - 0.5) * -10; // -5 to 5 degrees
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  };
  
  return (
    <section aria-labelledby="use-cases-heading" className="relative z-10 py-16 md:py-20 px-4 bg-slate-900/30">
      <div className="container mx-auto">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Reveal>
            <h2 id="use-cases-heading" className="font-display text-3xl md:text-4xl font-semibold text-white">
              Built For Every Trading Style
            </h2>
            <p className="text-gray-300 mt-4 text-lg leading-relaxed">
              Whether you're starting out or running automated systems, PipFactor adapts to your workflow.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {useCases.map((useCase, i) => (
            <Reveal key={i} delay={i * 100}>
              <article 
                className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 p-8 backdrop-blur-sm transition-all duration-300 hover:border-brand/50 hover:shadow-lg hover:shadow-brand/10"
                style={{ transformStyle: 'preserve-3d' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                
                <div className="relative" style={{ transform: 'translateZ(20px)' }}>
                  <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-brand/10 p-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {useCase.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    {useCase.title}
                  </h3>
                  <p className="mb-4 text-gray-300 leading-relaxed">
                    {useCase.desc}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-brand font-medium">
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    <span>{useCase.benefit}</span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
