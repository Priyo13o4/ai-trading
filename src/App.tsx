import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const queryClient = new QueryClient();
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
                "radial-gradient(70% 55% at 25% 20%, rgba(26, 46, 75, 0.24) 0%, rgba(26, 46, 75, 0) 65%), radial-gradient(55% 45% at 78% 72%, rgba(20, 34, 56, 0.2) 0%, rgba(20, 34, 56, 0) 70%), linear-gradient(160deg, #060a13 0%, #0c1423 52%, #111d31 100%)",
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
  <QueryClientProvider client={queryClient}>
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
                <Route path="/news" element={<NewsGate />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/signal" element={<Signal />} />
                  <Route path="/strategy" element={<Strategy />} />
                </Route>
              </Route>

              {/* Auth callback route (no navbar, standalone) */}
              <Route path="/auth/callback" element={<AuthCallback />} />
            
              {/* Removed standalone login/signup pages now using dialogs in Navbar */}

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;