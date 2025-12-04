import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { LoginModal } from "@/components/auth/login-modal";
import { SignupModal } from "@/components/auth/signup-modal";

export default function PostJob() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    budget: "",
    needsLogistics: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      setShowSignup(true);
    }
  }, [loading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowSignup(true);
      return;
    }

    if (!formData.category) {
      toast({
        title: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.createJob({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        budget: formData.budget || undefined,
        needsLogistics: formData.needsLogistics,
      });

      toast({
        title: "Job Posted Successfully!",
        description: "Artisans will be notified and start sending quotes soon.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Failed to post job",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-heading font-bold text-slate-900">Tell us what you need done</h1>
            <p className="text-slate-600 mt-2">We'll match you with the best artisans in your area.</p>
          </div>

          <Card className="shadow-lg border-none">
            <CardHeader className="bg-white border-b p-6">
              <CardTitle className="text-xl font-bold text-slate-800">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-base font-medium">Service Category</Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger className="h-12 text-base" data-testid="select-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumber">Plumbing</SelectItem>
                      <SelectItem value="electrician">Electrical</SelectItem>
                      <SelectItem value="carpenter">Building & Renovation</SelectItem>
                      <SelectItem value="painter">Painting</SelectItem>
                      <SelectItem value="logistics">Logistics & Transport</SelectItem>
                      <SelectItem value="general">General Handyman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">Job Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Fix leaking tap in kitchen" 
                    className="h-12 text-base" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required 
                    data-testid="input-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the issue in detail. Include specific requirements or measurements if known." 
                    className="min-h-[150px] text-base resize-none" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    data-testid="input-description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-base font-medium">Location (Suburb)</Label>
                    <Input 
                      id="location" 
                      placeholder="e.g., Sandton, Johannesburg" 
                      className="h-12 text-base" 
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required 
                      data-testid="input-location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-base font-medium">Estimated Budget (Optional)</Label>
                    <Input 
                      id="budget" 
                      placeholder="R 0.00" 
                      className="h-12 text-base" 
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      data-testid="input-budget"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="logistics" 
                    checked={formData.needsLogistics}
                    onCheckedChange={(checked) => setFormData({ ...formData, needsLogistics: checked as boolean })}
                    data-testid="checkbox-logistics"
                  />
                  <Label htmlFor="logistics" className="text-sm text-slate-600 font-normal">
                    I need materials delivered or rubble removed
                  </Label>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-lg font-bold h-14"
                    disabled={isSubmitting}
                    data-testid="button-submit-job"
                  >
                    {isSubmitting ? "Posting..." : "Post Job Now"}
                  </Button>
                  <p className="text-xs text-slate-400 text-center mt-4">
                    By posting, you agree to our Terms & Conditions. Your contact details are kept private until you accept a quote.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </Layout>
  );
}
