import { Link } from "react-router-dom";
import { BarChart3, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-brand" aria-hidden />
          <span className="font-display text-lg tracking-tight">StoxieX</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="#" className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link to="#" className="hover:text-foreground transition-colors">News</Link>
          <Link to="#" className="hover:text-foreground transition-colors">Explorer</Link>
          <Link to="#" className="hover:text-foreground transition-colors">Watch</Link>
          <Link to="#" className="hover:text-foreground transition-colors">Pilot</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden md:inline-flex">Log in</Button>
          <Button variant="gradient">Get Started</Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
