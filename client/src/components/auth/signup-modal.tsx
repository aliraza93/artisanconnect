import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { api } from "@/lib/api";
import { Mail, CheckCircle2 } from "lucide-react";

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

type SignupView = 'form' | 'verification';

export function SignupModal({ open, onOpenChange, onSwitchToLogin }: SignupModalProps) {
  const [view, setView] = useState<SignupView>('form');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "client" as "client" | "artisan" | "logistics",
  });
  
  // Artisan profile fields
  const [artisanData, setArtisanData] = useState({
    category: "",
    bio: "",
    location: "",
    yearsExperience: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { signup, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const signupData: any = { ...formData };
      
      // Add artisan profile if role is artisan
      if (formData.role === 'artisan') {
        signupData.artisanProfile = {
          category: artisanData.category,
          bio: artisanData.bio || undefined,
          location: artisanData.location || undefined,
          yearsExperience: artisanData.yearsExperience ? parseInt(artisanData.yearsExperience) : undefined,
        };
      }
      
      const user = await signup(signupData);
      toast({
        title: "Account created!",
        description: "Please verify your email address to continue.",
      });
      // Switch to verification view
      setView('verification');
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);

    try {
      const result = await api.verifyEmail(formData.email, verificationOtp);
      await refreshUser();
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified.",
      });
      onOpenChange(false);
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await api.sendVerificationEmail(formData.email);
      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setView('form');
      setVerificationOtp("");
    }
    onOpenChange(isOpen);
  };

  const renderSignupForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              data-testid="input-fullname"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="input-email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+27 123 456 789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-phone"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              data-testid="input-password"
            />
          </div>
          
          <div className="space-y-2">
            <Label>I am a...</Label>
            <RadioGroup
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as any })}
              data-testid="radio-role"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="client" data-testid="radio-client" />
                <Label htmlFor="client" className="font-normal">
                  Homeowner (looking for services)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="artisan" id="artisan" data-testid="radio-artisan" />
                <Label htmlFor="artisan" className="font-normal">
                  Artisan (plumber, electrician, etc.)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="logistics" id="logistics" data-testid="radio-logistics" />
                <Label htmlFor="logistics" className="font-normal">
                  Logistics Provider
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.role === 'artisan' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={artisanData.category}
                  onValueChange={(value) => setArtisanData({ ...artisanData, category: value })}
                  required
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumber">Plumber</SelectItem>
                    <SelectItem value="electrician">Electrician</SelectItem>
                    <SelectItem value="carpenter">Carpenter</SelectItem>
                    <SelectItem value="painter">Painter</SelectItem>
                    <SelectItem value="hvac">HVAC Technician</SelectItem>
                    <SelectItem value="welder">Welder</SelectItem>
                    <SelectItem value="architect">Architect</SelectItem>
                    <SelectItem value="cctv">CCTV Technician</SelectItem>
                    <SelectItem value="automation">Automation Specialist</SelectItem>
                    <SelectItem value="solar">Solar Installer</SelectItem>
                    <SelectItem value="generators">Generator Technician</SelectItem>
                    <SelectItem value="general">General Handyman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Johannesburg, Gauteng"
                  value={artisanData.location}
                  onChange={(e) => setArtisanData({ ...artisanData, location: e.target.value })}
                  data-testid="input-location"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  placeholder="5"
                  value={artisanData.yearsExperience}
                  onChange={(e) => setArtisanData({ ...artisanData, yearsExperience: e.target.value })}
                  min="0"
                  data-testid="input-experience"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Brief Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell clients about your expertise..."
                  value={artisanData.bio}
                  onChange={(e) => setArtisanData({ ...artisanData, bio: e.target.value })}
                  rows={3}
                  data-testid="input-bio"
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading} data-testid="button-signup">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          
          {onSwitchToLogin && (
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToLogin}
                className="p-0"
                data-testid="button-switch-login"
              >
                Sign in
              </Button>
            </div>
          )}
        </form>
  );

  const renderVerificationView = () => (
    <div className="space-y-4 mt-4">
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold">Verify Your Email</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We sent a 6-digit verification code to <span className="font-medium">{formData.email}</span>
        </p>
      </div>
      
      <form onSubmit={handleVerifyEmail} className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={verificationOtp}
            onChange={(value) => setVerificationOtp(value)}
            data-testid="input-verification-otp"
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
          disabled={verifying || verificationOtp.length !== 6}
          data-testid="button-verify-email"
        >
          {verifying ? "Verifying..." : "Verify Email"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto"
            onClick={handleResendCode}
            disabled={loading}
            data-testid="button-resend-verification"
          >
            Resend
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" data-testid="signup-modal">
        <DialogHeader>
          <DialogTitle>
            {view === 'verification' ? 'Verify Your Email' : 'Create Your Account'}
          </DialogTitle>
          <DialogDescription>
            {view === 'verification' 
              ? 'Enter the verification code sent to your email'
              : 'Join ArtisanConnect to find reliable service providers or grow your business'}
          </DialogDescription>
        </DialogHeader>
        {view === 'form' && renderSignupForm()}
        {view === 'verification' && renderVerificationView()}
      </DialogContent>
    </Dialog>
  );
}
