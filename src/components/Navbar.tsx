import { Link } from "@tanstack/react-router";
import { useAuth, UserButton } from "@clerk/tanstack-react-start";
import { Sparkles } from "lucide-react";
import { CreditBadge } from "./CreditBadge";

export function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-4 flex items-center justify-between glass border rounded-full pl-5 pr-2 py-2 shadow-soft">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid place-items-center w-8 h-8 rounded-full gradient-ember shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl text-ink">Slide Sphere</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            {!isSignedIn && (
              <>
                <a href="/#features" className="hover:text-foreground transition">Features</a>
                <Link to="/pricing" className="hover:text-foreground transition">Pricing</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2 min-h-[40px]">
            {isLoaded && !isSignedIn && (
              <Link to="/sign-up" className="inline-flex text-sm px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 shadow-glow">
                Get started
              </Link>
            )}
            {isLoaded && isSignedIn && (
              <>
                <CreditBadge />
                <Link to="/dashboard" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-full hover:bg-accent text-foreground">
                  Dashboard
                </Link>
                <div className="pl-1">
                  <UserButton />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
