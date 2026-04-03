import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { SignUpDialog } from "@/components/auth/SignUpDialog";
import { RequireAuth } from "@/components/RequireAuth";
import { CommunityDialog } from "@/components/marketing/CommunityDialog";

export const Navbar = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, isAuthenticated, status } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const authResolved = status !== 'loading';

  const handleSignupFromLogin = () => {
    setShowLogin(false);
    setTimeout(() => setShowSignup(true), 150);
  };

  const handleLoginFromSignup = () => {
    setShowSignup(false);
    setTimeout(() => setShowLogin(true), 150);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = (
    <>
      <a href="/#home" className="text-base font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors">Home</a>
      <a href="/pricing" className="text-base font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors">Pricing</a>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 text-base font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors outline-none cursor-pointer">
          Market Intel <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 bg-[#111315]/90 backdrop-blur-md border border-[#C8935A]/20 shadow-lg pt-2 pb-2">
          <RequireAuth to="/signal">
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-transparent focus:text-[#E2B485]">
              <a href="/signal" className="w-full text-base font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors py-2">Signal</a>
            </DropdownMenuItem>
          </RequireAuth>
          <RequireAuth to="/strategy">
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-transparent focus:text-[#E2B485]">
              <a href="/strategy" className="w-full text-base font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors py-2">Strategy</a>
            </DropdownMenuItem>
          </RequireAuth>
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-transparent focus:text-[#E2B485]">
            <a href="/news" className="w-full text-base font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors py-2">News</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <a href="mailto:support@pipfactor.com" className="text-base font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors">Contact</a>
      <CommunityDialog>
        <span className="text-base font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors cursor-pointer">Community</span>
      </CommunityDialog>
    </>
  );

  const authLinks = !authResolved ? null : isAuthenticated ? (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/profile')}
        className="text-[#E0E0E0] hover:bg-[#C8935A]/10 hover:text-[#E2B485] font-semibold"
      >
        <User className="mr-2 h-4 w-4" />
        Profile
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <LoginDialog open={showLogin} setOpen={setShowLogin} onSignupClick={handleSignupFromLogin}>
        <Button variant="outline" size="sm" className="bg-[#111315] border border-[#C8935A] text-[#E2B485] hover:bg-[#C8935A]/10 hover:text-[#C8935A] font-semibold transition-colors">Login</Button>
      </LoginDialog>
      <SignUpDialog open={showSignup} setOpen={setShowSignup} onLoginClick={handleLoginFromSignup}>
        <Button size="sm" className="bg-[#C8935A] border border-[#E2B485] text-[#111315] hover:bg-[#E2B485] font-semibold transition-colors">Sign Up</Button>
      </SignUpDialog>
    </div>
  );

  const { pathname } = useLocation();
  const isDashboardPage = ['/profile', '/strategy', '/signal', '/news'].includes(pathname);

  return (
    <header
      style={{ top: "var(--beta-banner-offset, 0px)" }}
      className={cn(
        "fixed left-0 w-full z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-in-out",
        (scrolled || isDashboardPage)
          ? "bg-[#111315]/90 backdrop-blur-lg border-b border-[#C8935A]/20 shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left aligned */}
          <div className="flex items-center flex-shrink-0">
            <a href="/" className="flex items-center gap-2 font-bold text-xl text-[#E2B485] hover:text-[#C8935A] transition-colors">
              <img src="/pipfactor.svg" alt="PipFactor" className="h-16 w-auto object-contain" />
              <span>PipFactor</span>
            </a>
          </div>

          {/* Navigation - Right aligned */}

          {isMobile ? (
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#E0E0E0]">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-1/2 max-w-[360px] min-w-[180px] p-0 bg-[#111315]/95 backdrop-blur-xl border-l border-[#C8935A]/20 flex flex-col items-stretch [&>button]:text-[#E0E0E0] [&>button:hover]:text-[#E2B485]"
                >
                  <div className="flex-1 flex flex-col justify-center px-6 py-8">
                    <nav className="flex flex-col gap-6 mt-2 w-full">
                      <a href="/#home" className="text-lg font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors w-full text-left">Home</a>
                      <a href="/pricing" className="text-lg font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors w-full text-left">Pricing</a>
                      <a href="/news" className="text-lg font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors w-full text-left">News</a>
                      <a href="mailto:support@pipfactor.com" className="text-lg font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors w-full text-left">Contact</a>
                      <RequireAuth to="/signal">
                        <a href="/signal" className="text-lg font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors w-full text-left block">Signal</a>
                      </RequireAuth>
                      <RequireAuth to="/strategy">
                        <a href="/strategy" className="text-lg font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors w-full text-left block">Strategy</a>
                      </RequireAuth>
                      <CommunityDialog>
                        <span className="text-lg font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors w-full text-left cursor-pointer block">Community</span>
                      </CommunityDialog>
                      {authResolved && isAuthenticated && user && (
                        <a href="/profile" className="text-lg font-semibold text-[#E0E0E0] hover:text-[#E2B485] transition-colors w-full text-left block">Profile</a>
                      )}
                    </nav>
                    <div className="mt-8 pt-6 border-t border-[#C8935A]/30 w-full flex flex-col gap-4">
                      {/* Stack Login/Signup vertically on mobile */}
                      {!authResolved ? null : !isAuthenticated ? (
                        <div className="flex flex-col gap-3 w-full mt-2">
                          <LoginDialog open={showLogin} setOpen={setShowLogin} onSignupClick={handleSignupFromLogin}>
                            <Button variant="outline" size="lg" className="bg-[#111315] border border-[#C8935A] text-[#E2B485] hover:bg-[#C8935A]/10 hover:text-[#C8935A] font-semibold w-full text-lg shadow-md transition-colors">Login</Button>
                          </LoginDialog>
                          <SignUpDialog open={showSignup} setOpen={setShowSignup} onLoginClick={handleLoginFromSignup}>
                            <Button size="lg" className="bg-[#C8935A] border border-[#E2B485] text-[#111315] hover:bg-[#E2B485] font-semibold w-full text-lg shadow-md transition-colors">Sign Up</Button>
                          </SignUpDialog>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 w-full mt-2">
                          <p className="text-xs text-[#E0E0E0]/40 text-center italic">Manage session in Profile</p>
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