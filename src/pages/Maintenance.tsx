import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import animationData from "@/assets/Maintenance.json";

const Maintenance = () => {
  const navigate = useNavigate();
  const lottieOptions = useMemo(
    () => ({
      animationData,
      loop: true,
      autoplay: true,
    }),
    []
  );

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#0a0d1a] via-[#0f1419] to-[#0a0d1a] text-slate-200">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-3xl space-y-8">
          <div className="mx-auto w-full max-w-md">
            <Lottie {...lottieOptions} className="h-auto w-full" />
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-200/70">Maintenance mode</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              We are refining PipFactor
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Thank you for your patience. We are upgrading your experience and will be back online shortly.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button
              variant="outline"
              className="border-blue-400/40 text-blue-100 hover:bg-blue-500/10"
              onClick={() => window.location.reload()}
            >
              Retry connection
            </Button>
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white"
              onClick={() => navigate('/')}
            >
              Back to home
            </Button>
            <p className="text-xs text-slate-500">If this persists, please check back in a few minutes.</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Maintenance;
