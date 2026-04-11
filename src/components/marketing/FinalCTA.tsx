import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";
import backgroundImage from "@/assets/Gemini_Generated_Image.png";

export const FinalCTA = () => {
    return (
        // The section has no background and uses negative margin to pull the FAQ section up behind it.
        <section className="relative z-20 -mb-32 pointer-events-none">
            <div className="container mx-auto px-4 lg:px-8 pointer-events-auto">
                <Reveal>
                    <div className="relative mx-auto max-w-5xl rounded-[2.5rem] p-[1px] overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.8)]">

                        {/* Outer Animated Gradient Border - Neon Green (#00FF41) Highlight */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00FF41] via-[#00FF41]/20 to-[#00FF41]/80 opacity-60" />

                        {/* Main Content Area Container */}
                        <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden bg-[#111315]">

                            {/* Background Image Layer */}
                            <div
                                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen scale-105 group-hover:scale-100 transition-transform duration-1000"
                                style={{
                                    backgroundImage: `url(${backgroundImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />

                            {/* Dark Overlay to Ensure Text Legibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111315] via-[#111315]/80 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-b from-[#111315]/40 to-transparent" />

                            {/* Foreground Content Layer */}
                            <div className="relative z-10 px-6 py-16 text-center sm:px-12 md:px-16 lg:py-24 flex flex-col items-center justify-center">

                                {/* Badge */}
                                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C8935A]/30 bg-[#C8935A]/10 px-4 py-2 text-sm font-medium text-[#E2B485] ">
                                    <div className="w-2 h-2 rounded-full bg-[#E2B485] animate-pulse shadow-[0_0_10px_#E2B485]" />
                                    Start Trading Smarter
                                </span>

                                {/* Headlines */}
                                <h2 className="mb-6 font-display text-4xl font-bold tracking-tight text-[#E0E0E0] sm:text-5xl lg:text-6xl drop-shadow-2xl">
                                    Trade Smarter with AI
                                </h2>
                                <p className="mx-auto mb-10 max-w-2xl text-lg text-[#9CA3AF] md:text-xl font-medium drop-shadow-md">
                                    AI-generated execution strategies powered by real-time news sentiment. Built to protect you from volatility.
                                </p>

                                {/* Call to Action Buttons */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                                    <Button size="lg" className="w-full sm:w-auto rounded-full bg-[#E2B485] text-[#111315] hover:bg-[#C8935A] hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(226,180,133,0.4)] px-10 py-6 text-lg font-bold tracking-wide border border-[#C8935A]">
                                        Start your free 7-day trial
                                    </Button>
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full border-[#C8935A]/40 bg-[#111315]  text-[#E0E0E0] hover:bg-[#C8935A]/20 hover:text-white px-10 py-6 text-lg transition-all duration-300">
                                        View Strategies
                                    </Button>
                                </div>

                                {/* Micro Benefits */}
                                <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-[#9CA3AF]">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-[#C8935A]" />
                                        <span>Breaking news analysis</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-[#C8935A]" />
                                        <span>Curated risk management</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-[#C8935A]" />
                                        <span>Beginner friendly</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
};
