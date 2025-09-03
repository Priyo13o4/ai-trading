import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export const Navbar = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navLinks = (
    <>
      <a href="/#home" className="text-sm font-medium text-slate-200 hover:text-primary transition-colors">Home</a>
      <a href="/#features" className="text-sm font-medium text-slate-200 hover:text-primary transition-colors">Features</a>
      <a href="/#contact" className="text-sm font-medium text-slate-200 hover:text-primary transition-colors">Contact</a>
    </>
  );

  const authLinks = user ? (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-200 hover:bg-slate-700">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  ) : (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Login</Button>
      <Button size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
    </div>
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out",
        scrolled
          ? "bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/20"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2 font-bold text-lg text-slate-200">
              <svg /* SVG code remains the same */ >
                <path d="M12 3v2.35l4.25 2.35-4.25 2.35V12l-4.25-2.35L12 7.3V3Z" />
                <path d="M12 12v2.35l4.25 2.35-4.25 2.35V21l-4.25-2.35L12 16.3V12Z" />
                <path d="M21.75 6.65 12 12l-9.75-5.35" />
                <path d="m2.25 17.35 9.75 5.35 9.75-5.35" />
              </svg>
              <span>Signal AI</span>
            </a>
          </div>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-slate-200" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-6 mt-8">{navLinks}</nav>
                <div className="mt-8 pt-6 border-t border-slate-700">{authLinks}</div>
              </SheetContent>
            </Sheet>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks}
              <div className="flex items-center gap-2">{authLinks}</div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};