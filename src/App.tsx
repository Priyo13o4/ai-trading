import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signal from "./pages/Signal";
import Strategy from "./pages/Strategy";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import AuthCallback from "./pages/AuthCallback";
import NewsPage from "./pages/NewsPage";
import Maintenance from "./pages/Maintenance";
import { Navbar } from "./components/marketing/Navbar";
import { BetaBanner } from "./components/marketing/BetaBanner";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { OfflineGate } from "./components/OfflineGate";

const DemoBackground = lazy(() => import("./components/ui/demo"));

const GradientBackgroundHost = () => {
  const { pathname } = useLocation();
  const shouldRender = pathname === "/" || pathname === "/news";

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

const MainLayout = () => (
  <>
    <GradientBackgroundHost />
    <BetaBanner />
    <Navbar />
    <Outlet />
  </>
);

const NewsGate = () => <NewsPage />;

const App = () => (
  <HelmetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes with Navbar */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
            </Route>

            <Route path="/maintenance" element={<Maintenance />} />

            {/* Offline-gated routes */}
            <Route element={<OfflineGate />}>
              <Route element={<MainLayout />}>
                <Route element={<ProtectedRoute />}>
                  <Route path="/news" element={<NewsGate />} />
                  <Route path="/signal" element={<Signal />} />
                  <Route path="/strategy" element={<Strategy />} />
                </Route>
              </Route>

              {/* Auth callback route (no navbar, standalone) */}
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/verify" element={<AuthCallback />} />
              <Route path="/auth/confirm" element={<AuthCallback />} />
              <Route path="/auth/recovery" element={<AuthCallback />} />

              {/* Removed standalone login/signup pages now using dialogs in Navbar */}

              {/* Protected routes */}
              <Route element={<MainLayout />}>
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </HelmetProvider>
);

export default App;