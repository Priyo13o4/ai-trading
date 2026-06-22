import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Signal from "./pages/Signal";
import Strategy from "./pages/Strategy";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import AuthCallback from "./pages/AuthCallback";
import AuthRecovery from "./pages/AuthRecovery";
import NewsPage from "./pages/NewsPage";
import Maintenance from "./pages/Maintenance";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import CookiePolicy from "./pages/CookiePolicy";
import Disclaimer from "./pages/Disclaimer";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import { Navbar } from "./components/marketing/Navbar";
import { Footer } from "./components/marketing/Footer";
import { CookieBanner } from "./components/marketing/CookieBanner";
import { BetaBanner } from "./components/marketing/BetaBanner";
import { AuthProvider } from "./hooks/useAuth";
import { useAuth } from "./hooks/useAuth";
import { OnboardingProvider } from "./features/onboarding";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TrialBanner } from "./components/subscription/TrialBanner";
import { OfflineGate } from "./components/OfflineGate";
import { captureReferralCodeFromSearch } from "./lib/referral";

const DemoBackground = lazy(() => import("./components/ui/demo"));

const GradientBackgroundHost = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const shouldRender = pathname === "/" || (isAuthenticated && pathname === "/news");

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Suspense
        fallback={
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(100% 50% at 50% -15%, rgba(226, 180, 133, 0.08) 0%, transparent 70%), linear-gradient(180deg, #111315 0%, #0d0e10 40%, #040506 100%)",
            }}
          />
        }
      >
        <DemoBackground />
      </Suspense>
    </div>
  );
};

const MainLayout = () => {
  const { pathname } = useLocation();
  const { isAuthenticated, status } = useAuth();
  const shouldShowTrialBanner = status !== "loading" && !isAuthenticated && pathname === "/";

  return (
    <>
      <GradientBackgroundHost />
      {shouldShowTrialBanner ? <BetaBanner /> : <TrialBanner />}
      <Navbar />
      <Outlet />
      <Footer />
      <CookieBanner />
    </>
  );
};

const NewsGate = () => <NewsPage />;

const ReferralCapture = () => {
  const location = useLocation();

  useEffect(() => {
    captureReferralCodeFromSearch(location.search);
  }, [location.search]);

  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => (
  <HelmetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Maintenance errorCode={503} />
      </BrowserRouter>
    </TooltipProvider>
  </HelmetProvider>
);

export default App;