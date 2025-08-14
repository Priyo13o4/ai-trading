import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export const Navbar = () => {
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);

  // Effect to handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      // Set state to true if user has scrolled more than 20px
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    // Clean up the event listener on component unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = (
    <>
      <a href="#home" className="text-sm font-medium text-slate-200 hover:text-primary transition-colors">Home</a>
      <a href="#about" className="text-sm font-medium text-slate-200 hover:text-primary transition-colors">About</a>
      <a href="#features" className="text-sm font-medium text-slate-200 hover:text-primary transition-colors">Features</a>
      <a href="#contact" className="text-sm font-medium text-slate-200 hover:text-primary transition-colors">Contact</a>
    </>
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out",
        // Apply frosted glass effect when scrolled
        scrolled
          // EDITED: Changed bg-background to a dark slate color to match the page theme
          ? "bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/20"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2 font-bold text-lg text-slate-200">
              <svg
                className="h-6 w-6 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              </SheetContent>
            </Sheet>
          ) : (
            <nav className="hidden md:flex items-center gap-6">{navLinks}</nav>
          )}
        </div>
      </div>
    </header>
  );
};
