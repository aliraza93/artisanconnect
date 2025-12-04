import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";

export default function PostJob() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Job Posted Successfully!",
        description: "Artisans will be notified and start sending quotes soon.",
      });
      setLocation("/dashboard");
    }, 1500);
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
                  <Select required>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="building">Building & Renovation</SelectItem>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="logistics">Logistics & Transport</SelectItem>
                      <SelectItem value="gardening">Gardening & Landscaping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">Job Title</Label>
                  <Input id="title" placeholder="e.g., Fix leaking tap in kitchen" className="h-12 text-base" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the issue in detail. Include specific requirements or measurements if known." 
                    className="min-h-[150px] text-base resize-none" 
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-base font-medium">Location (Suburb)</Label>
                    <Input id="location" placeholder="e.g., Sandton, Johannesburg" className="h-12 text-base" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-base font-medium">Estimated Budget (Optional)</Label>
                    <Input id="budget" placeholder="R 0.00" className="h-12 text-base" />
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-lg font-bold h-14"
                    disabled={isSubmitting}
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
    </Layout>
  );
}
