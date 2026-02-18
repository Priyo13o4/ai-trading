import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signal from "./pages/Signal";
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

const MainLayout = () => (
  <>
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