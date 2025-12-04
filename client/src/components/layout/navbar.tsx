import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Hammer, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/">
              <a className="flex items-center gap-2 cursor-pointer">
                <div className="bg-primary p-1.5 rounded-lg text-white">
                  <Hammer className="h-6 w-6" />
                </div>
                <span className="font-heading font-bold text-xl text-foreground">
                  ArtisanConnect<span className="text-primary">SA</span>
                </span>
              </a>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/find-artisan">
              <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Find an Artisan
              </a>
            </Link>
            <Link href="/find-work">
              <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Find Work
              </a>
            </Link>
            <Link href="/logistics">
              <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Logistics
              </a>
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Log In
              </a>
            </Link>
            <Link href="/register">
              <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t p-4 space-y-4 shadow-lg">
          <div className="flex flex-col space-y-4">
            <Link href="/find-artisan">
              <a className="text-base font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                Find an Artisan
              </a>
            </Link>
            <Link href="/find-work">
              <a className="text-base font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                Find Work
              </a>
            </Link>
            <Link href="/logistics">
              <a className="text-base font-medium text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                Logistics
              </a>
            </Link>
            <hr />
            <Link href="/login">
              <a className="text-base font-medium text-foreground" onClick={() => setIsOpen(false)}>
                Log In
              </a>
            </Link>
            <Link href="/register">
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
