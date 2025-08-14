import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signal from "./pages/Signal";
import { Navbar } from "./components/marketing/Navbar";

const queryClient = new QueryClient();

// A simple layout component that adds the Navbar to pages.
const MainLayout = () => (
  <>
    <Navbar />
    <Outlet /> {/* This renders the matched route's component, e.g., <Index /> */}
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* All routes inside MainLayout will have the Navbar */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/signal" element={<Signal />} />
          </Route>
          
          {/* The NotFound page won't have the Navbar */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
