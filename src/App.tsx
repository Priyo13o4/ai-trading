import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import AuthCallback from "./pages/AuthCallback";
import AuthRecovery from "./pages/AuthRecovery";
import Maintenance from "./pages/Maintenance";
import { Navbar } from "./components/marketing/Navbar";
import { BetaBanner } from "./components/marketing/BetaBanner";
import { AuthProvider } from "./hooks/useAuth";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TrialBanner } from "./components/subscription/TrialBanner";
import { OfflineGate } from "./components/OfflineGate";
import { captureReferralCodeFromSearch } from "./lib/referral";

const DemoBackground = lazy(() => import("./components/ui/demo"));

const GradientBackgroundHost = () => {
  const { pathname } = useLocation();
  const shouldRender = pathname === "/";

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
    </>
  );
};

const ReferralCapture = () => {
  const location = useLocation();

  useEffect(() => {
    captureReferralCodeFromSearch(location.search);
  }, [location.search]);

  return null;
};

const App = () => (
  <HelmetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ReferralCapture />
          <Routes>
            {/* Public routes with Navbar */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
            </Route>

            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/news" element={<Maintenance errorCode={530} />} />
            <Route path="/signal" element={<Maintenance errorCode={530} />} />
            <Route path="/strategy" element={<Maintenance errorCode={530} />} />

            {/* Auth callback routes must bypass OfflineGate to avoid mobile callback dead-ends */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/verify" element={<AuthCallback />} />
            <Route path="/auth/confirm" element={<AuthCallback />} />
            <Route path="/auth/recovery" element={<AuthRecovery />} />

            {/* Offline-gated routes */}
            <Route element={<OfflineGate />}>
              {/* Protected routes */}
              <Route element={<MainLayout />}>
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>

              <Route path="*" element={<Maintenance errorCode={404} />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </HelmetProvider>
);

export default App;