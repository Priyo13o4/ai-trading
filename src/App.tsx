import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signal from "./pages/Signal";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import { Navbar } from "./components/marketing/Navbar";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const MainLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

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
            </Route>
            
            {/* Auth pages without Navbar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/signal" element={<Signal />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;