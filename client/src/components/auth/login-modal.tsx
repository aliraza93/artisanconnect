import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignup?: () => void;
}

export function LoginModal({ open, onOpenChange, onSwitchToSignup }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.fullName}`,
      });
      onOpenChange(false);
      
      // Redirect based on role
      if (user.role === 'admin') {
        setLocation('/admin/dashboard');
      } else {
        setLocation('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="login-modal">
        <DialogHeader>
          <DialogTitle>Welcome Back</DialogTitle>
          <DialogDescription>
            Sign in to your ArtisanConnect account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          {onSwitchToSignup && (
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToSignup}
                className="p-0"
                data-testid="button-switch-signup"
              >
                Sign up
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
