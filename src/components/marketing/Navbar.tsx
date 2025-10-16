import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { SignUpDialog } from "@/components/auth/SignUpDialog";
import { RequireAuth } from "@/components/RequireAuth";
import { CommunityDialog } from "@/components/marketing/CommunityDialog";

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
      <a href="/#home" className="text-base font-semibold text-slate-100 hover:text-[#D4AF37] transition-colors">Home</a>
      <a href="/#features" className="text-base font-semibold text-slate-100 hover:text-[#D4AF37] transition-colors">Features</a>
      <a href="/#contact" className="text-base font-semibold text-slate-100 hover:text-[#D4AF37] transition-colors">Contact</a>
      <RequireAuth to="/signal">
        <a href="/signal" className="text-base font-semibold text-slate-100 hover:text-[#D4AF37] transition-colors">Signal</a>
      </RequireAuth>
      <CommunityDialog>
        <span className="text-base font-semibold text-slate-100 hover:text-[#D4AF37] transition-colors cursor-pointer">Community</span>
      </CommunityDialog>
    </>
  );

  const authLinks = user ? (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-100 hover:bg-blue-900/60 font-semibold">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  ) : (
    <div className="flex items-center gap-2">
      <LoginDialog>
        <Button variant="outline" size="sm" className="bg-white border border-blue-500 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-semibold transition-colors">Login</Button>
      </LoginDialog>
      <SignUpDialog>
        <Button size="sm" className="bg-blue-600 border border-blue-700 text-white hover:bg-blue-700 font-semibold transition-colors">Sign Up</Button>
      </SignUpDialog>
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
          {/* Logo - Left aligned */}
          <div className="flex items-center flex-shrink-0">
            <a href="/" className="flex items-center gap-2 font-bold text-xl text-[#D4AF37] hover:text-[#E5C158] transition-colors">
              <img src="/pipfactor.svg" alt="PipFactor" className="h-16 w-auto object-contain" />
              <span>PipFactor</span>
            </a>
          </div>

          {/* Navigation - Right aligned */}

          {isMobile ? (
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-200">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-1/2 max-w-[360px] min-w-[180px] p-0 bg-slate-900/70 dark:bg-slate-900/70 flex flex-col items-stretch glassy-menu [&>button]:text-white [&>button:hover]:text-blue-400"
                >
                  <div className="flex-1 flex flex-col justify-center px-6 py-8">
                    <nav className="flex flex-col gap-6 mt-2 w-full">
                      <a href="/#home" className="text-lg font-semibold text-white hover:text-[#D4AF37] transition-colors w-full text-left">Home</a>
                      <a href="/#features" className="text-lg font-semibold text-white hover:text-[#D4AF37] transition-colors w-full text-left">Features</a>
                      <a href="/#contact" className="text-lg font-semibold text-white hover:text-[#D4AF37] transition-colors w-full text-left">Contact</a>
                      <RequireAuth to="/signal">
                        <a href="/signal" className="text-lg font-semibold text-white hover:text-[#D4AF37] transition-colors w-full text-left block">Signal</a>
                      </RequireAuth>
                      <CommunityDialog>
                        <span className="text-lg font-semibold text-white hover:text-[#D4AF37] transition-colors w-full text-left cursor-pointer block">Community</span>
                      </CommunityDialog>
                    </nav>
                    <div className="mt-8 pt-6 border-t border-white/30 w-full flex flex-col gap-4">
                      {/* Stack Login/Signup vertically on mobile */}
                      {!user ? (
                        <div className="flex flex-col gap-3 w-full mt-2">
                          <LoginDialog>
                            <Button variant="outline" size="lg" className="bg-white border border-blue-500 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-semibold w-full text-lg shadow-md transition-colors">Login</Button>
                          </LoginDialog>
                          <SignUpDialog>
                            <Button size="lg" className="bg-blue-600 border border-blue-700 text-white hover:bg-blue-700 font-semibold w-full text-lg shadow-md transition-colors">Sign Up</Button>
                          </SignUpDialog>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 w-full mt-2">
                          <Button variant="ghost" size="lg" onClick={handleLogout} className="text-blue-900 dark:text-slate-100 hover:bg-blue-200/60 dark:hover:bg-blue-900/60 font-semibold w-full text-lg shadow-md">
                            <LogOut className="mr-2 h-5 w-5" />
                            Logout
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks}
              <div className="flex items-center gap-2 ml-4">
                {authLinks}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};