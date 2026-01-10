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
import { SimpleImageUploader } from "@/components/SimpleImageUploader";
import { X, Camera } from "lucide-react";
import { PlacesAutocomplete } from "@/components/maps/places-autocomplete";
import { useSEO } from "@/hooks/use-seo";

export default function PostJob() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useSEO({
    title: 'Post a Job - Find Artisans Near You',
    description: 'Post your home project and receive competitive quotes from verified artisans. Plumbing, electrical, building work and more.'
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    budget: "",
    needsLogistics: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      setShowSignup(true);
    }
  }, [loading, user]);

  const handleUploadComplete = (imageURLs: string[]) => {
    setUploadedImages(prev => [...prev, ...imageURLs]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

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
      // Create job with images included
      const job = await api.createJob({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        address: formData.address || undefined,
        latitude: formData.latitude !== null ? String(formData.latitude) : undefined,
        longitude: formData.longitude !== null ? String(formData.longitude) : undefined,
        budget: formData.budget || undefined,
        needsLogistics: formData.needsLogistics,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
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
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
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
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="welder">Welding</SelectItem>
                      <SelectItem value="architect">Architecture</SelectItem>
                      <SelectItem value="cctv">CCTV & Security</SelectItem>
                      <SelectItem value="automation">Home Automation</SelectItem>
                      <SelectItem value="solar">Solar Installation</SelectItem>
                      <SelectItem value="generators">Generators</SelectItem>
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    required
                    data-testid="input-description"
                  />
                </div>

                <div className="space-y-2">
                  <PlacesAutocomplete
                    id="address"
                    label="Job Address"
                    value={formData.address || formData.location}
                    onChange={(address, lat, lng) => {
                      setFormData((prev) => ({
                        ...prev,
                        address: address,
                        location: address.split(',')[0] || address, // Use first part as location/suburb
                        latitude: lat,
                        longitude: lng,
                      }));
                    }}
                    placeholder="Enter the job address"
                    required
                    countryRestriction="za"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-base font-medium">Location (Suburb) - Auto-filled</Label>
                    <Input 
                      id="location" 
                      placeholder="e.g., Sandton, Johannesburg" 
                      className="h-12 text-base bg-slate-50" 
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      required 
                      data-testid="input-location"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-base font-medium">Estimated Budget (Optional)</Label>
                    <Input 
                      id="budget" 
                      placeholder="R 0.00" 
                      className="h-12 text-base" 
                      value={formData.budget}
                      onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                      data-testid="input-budget"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="logistics" 
                    checked={formData.needsLogistics}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, needsLogistics: checked as boolean }))}
                    data-testid="checkbox-logistics"
                  />
                  <Label htmlFor="logistics" className="text-sm text-slate-600 font-normal">
                    I need materials delivered or rubble removed
                  </Label>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Photos (Optional)</Label>
                    <p className="text-sm text-slate-500">
                      Add photos to help artisans understand the job better (max 5 photos)
                    </p>
                  </div>
                  
                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" data-testid="uploaded-images-container">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img 
                            src={url} 
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-slate-200 shadow-sm"
                            data-testid={`uploaded-image-${index}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            data-testid={`button-remove-image-${index}`}
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}

                  {user && (
                    <SimpleImageUploader
                      maxFiles={5}
                      maxFileSize={10485760}
                      onUploadComplete={handleUploadComplete}
                      existingImages={uploadedImages}
                    />
                  )}
                  
                  {!user && (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50/50">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mx-auto mb-3">
                        <Camera className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-400">
                        Sign in to upload photos
                      </p>
                    </div>
                  )}
                  
                  {uploadedImages.length >= 5 && (
                    <div className="text-center py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-600 font-medium">
                        Maximum of 5 photos reached
                      </p>
                    </div>
                  )}
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
