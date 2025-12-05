import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { ArrowLeft, Mail, KeyRound, Lock } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignup?: () => void;
}

type ModalView = 'login' | 'forgot-email' | 'forgot-otp' | 'forgot-newpass';

export function LoginModal({ open, onOpenChange, onSwitchToSignup }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Password reset state
  const [view, setView] = useState<ModalView>('login');
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetState = () => {
    setView('login');
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.fullName}`,
      });
      handleClose(false);
      
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

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.requestPasswordReset(resetEmail);
      toast({
        title: "Code Sent",
        description: "Check your email for the password reset code.",
      });
      setView('forgot-otp');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.verifyOTP(resetEmail, otp);
      toast({
        title: "Code Verified",
        description: "You can now set a new password.",
      });
      setView('forgot-newpass');
    } catch (error: any) {
      toast({
        title: "Invalid Code",
        description: error.message || "The code is invalid or expired",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(resetEmail, otp, newPassword);
      toast({
        title: "Password Reset!",
        description: "You can now log in with your new password.",
      });
      resetState();
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLoginView = () => (
    <form onSubmit={handleLogin} className="space-y-4 mt-4">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-xs text-muted-foreground"
            onClick={() => setView('forgot-email')}
            data-testid="button-forgot-password"
          >
            Forgot password?
          </Button>
        </div>
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
  );

  const renderForgotEmailView = () => (
    <div className="space-y-4 mt-4">
      <Button
        variant="ghost"
        size="sm"
        className="p-0 h-auto"
        onClick={() => setView('login')}
        data-testid="button-back-to-login"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to login
      </Button>
      
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold">Forgot your password?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we'll send you a code to reset it.
        </p>
      </div>
      
      <form onSubmit={handleRequestReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email Address</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="you@example.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            data-testid="input-reset-email"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading} data-testid="button-send-code">
          {loading ? "Sending..." : "Send Reset Code"}
        </Button>
      </form>
    </div>
  );

  const renderOtpView = () => (
    <div className="space-y-4 mt-4">
      <Button
        variant="ghost"
        size="sm"
        className="p-0 h-auto"
        onClick={() => setView('forgot-email')}
        data-testid="button-back-to-email"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Change email
      </Button>
      
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold">Enter your code</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We sent a 6-digit code to <span className="font-medium">{resetEmail}</span>
        </p>
      </div>
      
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
            data-testid="input-otp"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || otp.length !== 6}
          data-testid="button-verify-code"
        >
          {loading ? "Verifying..." : "Verify Code"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto"
            onClick={handleRequestReset}
            disabled={loading}
            data-testid="button-resend-code"
          >
            Resend
          </Button>
        </div>
      </form>
    </div>
  );

  const renderNewPasswordView = () => (
    <div className="space-y-4 mt-4">
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold">Create new password</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter a new password for your account
        </p>
      </div>
      
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            data-testid="input-new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            data-testid="input-confirm-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading} data-testid="button-reset-password">
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </div>
  );

  const getTitle = () => {
    switch (view) {
      case 'forgot-email':
        return "Reset Password";
      case 'forgot-otp':
        return "Verify Code";
      case 'forgot-newpass':
        return "New Password";
      default:
        return "Welcome Back";
    }
  };

  const getDescription = () => {
    switch (view) {
      case 'forgot-email':
      case 'forgot-otp':
      case 'forgot-newpass':
        return "Reset your ArtisanConnect password";
      default:
        return "Sign in to your ArtisanConnect account";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="login-modal">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        {view === 'login' && renderLoginView()}
        {view === 'forgot-email' && renderForgotEmailView()}
        {view === 'forgot-otp' && renderOtpView()}
        {view === 'forgot-newpass' && renderNewPasswordView()}
      </DialogContent>
    </Dialog>
  );
}
