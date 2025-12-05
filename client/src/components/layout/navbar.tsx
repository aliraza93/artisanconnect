import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import logoImage from "@assets/AC_1764929686540.png";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoginModal } from "@/components/auth/login-modal";
import { SignupModal } from "@/components/auth/signup-modal";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img src={logoImage} alt="ArtisanConnect SA" className="h-12 w-auto" />
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/find-artisan">
              <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Find an Artisan
              </span>
            </Link>
            <Link href="/find-work">
              <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Find Work
              </span>
            </Link>
            <Link href="/logistics">
              <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Logistics
              </span>
            </Link>
          </div>

          {/* Desktop Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-white font-bold">
                        {getUserInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none" data-testid="text-user-name">{user.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground capitalize mt-1">
                        <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-full" data-testid="badge-user-role">
                          {user.role}
                        </span>
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/dashboard')} data-testid="menu-dashboard">
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setLocation('/admin/dashboard')} data-testid="menu-admin">
                      <User className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost"
                  onClick={() => setShowLogin(true)}
                  className="text-sm font-medium"
                  data-testid="button-login-nav"
                >
                  Log In
                </Button>
                <Button 
                  onClick={() => setShowSignup(true)}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-full px-6"
                  data-testid="button-signup-nav"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-foreground p-2"
              data-testid="button-mobile-menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 pt-4 pb-6 space-y-3">
            {user ? (
              <>
                <div className="pb-3 border-b">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs mt-2 capitalize">
                    {user.role}
                  </span>
                </div>
                <Link href="/dashboard">
                  <div className="block py-2 text-sm font-medium text-foreground hover:text-primary cursor-pointer" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </div>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin/dashboard">
                    <div className="block py-2 text-sm font-medium text-foreground hover:text-primary cursor-pointer" onClick={() => setIsOpen(false)}>
                      Admin Panel
                    </div>
                  </Link>
                )}
              </>
            ) : null}
            
            <Link href="/find-artisan">
              <div className="block py-2 text-sm font-medium text-foreground hover:text-primary cursor-pointer" onClick={() => setIsOpen(false)}>
                Find an Artisan
              </div>
            </Link>
            <Link href="/find-work">
              <div className="block py-2 text-sm font-medium text-foreground hover:text-primary cursor-pointer" onClick={() => setIsOpen(false)}>
                Find Work
              </div>
            </Link>
            <Link href="/logistics">
              <div className="block py-2 text-sm font-medium text-foreground hover:text-primary cursor-pointer" onClick={() => setIsOpen(false)}>
                Logistics
              </div>
            </Link>

            {user ? (
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full mt-4"
                data-testid="button-logout-mobile"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            ) : (
              <div className="pt-3 border-t space-y-2">
                <Button 
                  onClick={() => {
                    setIsOpen(false);
                    setShowLogin(true);
                  }}
                  variant="outline" 
                  className="w-full"
                  data-testid="button-login-mobile"
                >
                  Log In
                </Button>
                <Button 
                  onClick={() => {
                    setIsOpen(false);
                    setShowSignup(true);
                  }}
                  className="w-full bg-secondary hover:bg-secondary/90"
                  data-testid="button-signup-mobile"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modals */}
      <LoginModal 
        open={showLogin} 
        onOpenChange={setShowLogin}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />
      <SignupModal 
        open={showSignup} 
        onOpenChange={setShowSignup}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    </nav>
  );
}
