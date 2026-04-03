import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import animationData from "@/assets/Maintenance.json";
import { SEOHead } from "@/components/SEOHead";

interface MaintenanceProps {
  errorCode?: number;
}

interface ErrorContent {
  label: string;
  title: string;
  subtitle: string;
  showRetry: boolean;
  showLogin: boolean;
}

function getErrorContent(errorCode?: number): ErrorContent {
  switch (errorCode) {
    case 404:
      return {
        label: "Not found",
        title: "Page Not Found",
        subtitle: "The page you're looking for doesn't exist.",
        showRetry: false,
        showLogin: false,
      };
    case 401:
      return {
        label: "Unauthorized",
        title: "Unauthorized",
        subtitle: "You need to log in to access this.",
        showRetry: false,
        showLogin: true,
      };
    case 403:
      return {
        label: "Access denied",
        title: "Access Denied",
        subtitle: "You don't have permission to access this resource.",
        showRetry: false,
        showLogin: true,
      };
    case 405:
      return {
        label: "Service error",
        title: "Service Error",
        subtitle: "There's a configuration issue. Our team has been notified.",
        showRetry: true,
        showLogin: false,
      };
    case 503:
      return {
        label: "Maintenance mode",
        title: "We are refining PipFactor",
        subtitle:
          "Thank you for your patience. We are upgrading your experience and will be back online shortly.",
        showRetry: true,
        showLogin: false,
      };
    default:
      return {
        label: "Unavailable",
        title: "Something went wrong",
        subtitle: "We're having trouble connecting. Please try again shortly.",
        showRetry: true,
        showLogin: false,
      };
  }
}

const Maintenance = ({ errorCode }: MaintenanceProps) => {
  const navigate = useNavigate();
  const lottieOptions = useMemo(
    () => ({
      animationData,
      loop: true,
      autoplay: true,
    }),
    []
  );

  const { label, title, subtitle, showRetry, showLogin } = getErrorContent(errorCode);

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#0a0d1a] via-[#0f1419] to-[#0a0d1a] text-slate-200">
      <SEOHead 
        title={`${title} — PipFactor`} 
        description={subtitle}
        canonical={window.location.origin + window.location.pathname}
        noIndex
      />
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-3xl space-y-8">
          <div className="mx-auto w-full max-w-md">
            <Lottie {...lottieOptions} className="h-auto w-full" />
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-200/70">
              {errorCode && <span className="mr-2 font-bold">{errorCode}</span>}
              {label}
            </p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              {title}
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            {showRetry && (
              <Button
                variant="outline"
                className="border-blue-400/40 text-blue-100 hover:bg-blue-500/10"
                onClick={() => window.location.reload()}
              >
                Retry connection
              </Button>
            )}
            {showLogin && (
              <Button
                variant="outline"
                className="border-blue-400/40 text-blue-100 hover:bg-blue-500/10"
                onClick={() => navigate('/')}
              >
                Go to Login
              </Button>
            )}
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
