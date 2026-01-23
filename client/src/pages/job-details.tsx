import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin, Briefcase, ArrowLeft, X, CheckCircle } from "lucide-react";
import { api, type Job, type Quote } from "@/lib/api";
import { useRoute, useLocation } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { useAuth } from "@/lib/auth-context";
import { MapView } from "@/components/maps/map-view";
import { useToast } from "@/hooks/use-toast";
import { LoginModal } from "@/components/auth/login-modal";

const CATEGORIES: Record<string, string> = {
  plumber: "Plumbing",
  electrician: "Electrical",
  carpenter: "Building & Renovation",
  painter: "Painting",
  hvac: "HVAC",
  welder: "Welding",
  architect: "Architecture",
  cctv: "CCTV & Security",
  automation: "Home Automation",
  solar: "Solar Installation",
  generators: "Generators",
  logistics: "Logistics & Transport",
  general: "General Handyman",
};

function getStatusBadge(status: Job['status']) {
  const badges = {
    open: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">Open</Badge>,
    quoted: <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">Quoted</Badge>,
    in_progress: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-100">In Progress</Badge>,
    completed: <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-100">Completed</Badge>,
    cancelled: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100">Cancelled</Badge>,
    disputed: <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100">Disputed</Badge>,
  };
  return badges[status] || null;
}

export default function JobDetails() {
  const [, params] = useRoute("/job/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const jobId = params?.id;
  const [job, setJob] = useState<Job | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    billingType: 'fixed' as 'fixed' | 'hourly',
    amount: '',
    hourlyRate: '',
    estimatedHours: '',
    message: '',
  });

  useSEO({
    title: job ? `${job.title} - Job Details` : 'Job Details',
    description: job ? `View details for ${job.title}` : 'View job details'
  });

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      setLoading(true);
      try {
        const [jobData, quotesData] = await Promise.all([
          api.getJob(jobId),
          user?.role === 'artisan' ? api.getMyQuotes().catch(() => []) : Promise.resolve([]),
        ]);
        setJob(jobData);
        
        // Filter quotes for this job
        if (user?.role === 'artisan') {
          const jobQuotes = quotesData.filter((q: Quote) => q.jobId === jobId);
          setQuotes(jobQuotes);
        }
      } catch (error) {
        console.error("Failed to fetch job:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, user]);

  const handleSubmitQuote = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (user.role !== 'artisan') {
      toast({
        title: "Only artisans can submit quotes",
        variant: "destructive",
      });
      return;
    }

    if (!job) return;

    if (quoteForm.billingType === 'fixed' && !quoteForm.amount) {
      toast({
        title: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    if (quoteForm.billingType === 'hourly' && (!quoteForm.hourlyRate || !quoteForm.estimatedHours)) {
      toast({
        title: "Please enter hourly rate and estimated hours",
        variant: "destructive",
      });
      return;
    }

    setSubmittingQuote(true);
    try {
      await api.createQuote({
        jobId: job.id,
        billingType: quoteForm.billingType,
        amount: quoteForm.billingType === 'fixed' ? quoteForm.amount : undefined,
        hourlyRate: quoteForm.billingType === 'hourly' ? quoteForm.hourlyRate : undefined,
        estimatedHours: quoteForm.billingType === 'hourly' ? quoteForm.estimatedHours : undefined,
        message: quoteForm.message || undefined,
      });

      toast({
        title: "Quote submitted successfully!",
        description: "The client will review your quote.",
      });

      setShowQuoteModal(false);
      setQuoteForm({
        billingType: 'fixed',
        amount: '',
        hourlyRate: '',
        estimatedHours: '',
        message: '',
      });

      // Refresh job data and quotes
      const [updatedJob, myQuotes] = await Promise.all([
        api.getJob(job.id),
        user?.role === 'artisan' ? api.getMyQuotes().catch(() => []) : Promise.resolve([]),
      ]);
      setJob(updatedJob);
      if (user?.role === 'artisan') {
        const jobQuotes = myQuotes.filter((q: Quote) => q.jobId === job.id);
        setQuotes(jobQuotes);
      }
    } catch (error: any) {
      toast({
        title: "Failed to submit quote",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingQuote(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-none shadow-sm">
              <CardContent className="p-8">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <Skeleton className="h-4 w-3/4 mb-8" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-none shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500 text-lg">Job not found</p>
                <Button variant="outline" onClick={() => setLocation("/find-work")} className="mt-4">
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const hasQuoted = user?.role === 'artisan' && quotes.some(q => q.artisanId === user.id);
  const userQuote = user?.role === 'artisan' ? quotes.find(q => q.artisanId === user.id) : null;
  const canSubmitQuote = user?.role === 'artisan' && job.status === 'open' && !hasQuoted;

  return (
    <Layout>
      <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/find-work")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>

          <div className="space-y-6">
            {/* Job Header */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-3xl font-heading font-bold text-slate-900">
                        {job.title}
                      </h1>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-base px-3 py-1">
                        {CATEGORIES[job.category] || job.category}
                      </Badge>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-5 h-5" />
                        <span>{job.location}</span>
                      </div>
                      {job.budget && (
                        <div className="font-bold text-slate-900 text-lg">
                          Budget: R {job.budget}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      Posted on {formatDate(job.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Images */}
            {job.images && Array.isArray(job.images) && job.images.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Images ({job.images.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {job.images.map((image, index) => {
                      if (!image) return null;
                      return (
                        <div key={index} className="rounded-lg overflow-hidden border">
                          <img
                            src={image}
                            alt={`${job.title} - Image ${index + 1}`}
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              console.error('Failed to load image:', image);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </CardContent>
            </Card>

            {/* Location Map */}
            {job.address && job.latitude && job.longitude && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 mb-4">{job.address}</p>
                  <MapView
                    latitude={parseFloat(job.latitude)}
                    longitude={parseFloat(job.longitude)}
                    address={job.address}
                    height="400px"
                    markerTitle={job.title}
                  />
                </CardContent>
              </Card>
            )}

            {/* Quote Status */}
            {hasQuoted && userQuote && (
              <Card className="border-none shadow-sm bg-green-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-bold text-slate-900">Quote Submitted</h3>
                      <p className="text-sm text-slate-600">
                        Status: <Badge variant="outline" className={
                          userQuote.status === 'accepted' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : userQuote.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                        }>
                          {userQuote.status.charAt(0).toUpperCase() + userQuote.status.slice(1)}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Amount:</span>
                      <span className="font-medium">R {userQuote.amount}</span>
                    </div>
                    {userQuote.billingType === 'hourly' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Hourly Rate:</span>
                          <span className="font-medium">R {userQuote.hourlyRate}/hr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Estimated Hours:</span>
                          <span className="font-medium">{userQuote.estimatedHours} hours</span>
                        </div>
                      </>
                    )}
                    {userQuote.message && (
                      <div className="pt-2 border-t">
                        <span className="text-slate-600">Message:</span>
                        <p className="text-slate-700 mt-1">{userQuote.message}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Quote Button */}
            {canSubmitQuote && (
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowQuoteModal(true)}
                  className="bg-secondary hover:bg-secondary/90 text-lg px-8 py-6"
                  size="lg"
                >
                  <Briefcase className="w-5 h-5 mr-2" />
                  Submit Quote
                </Button>
              </div>
            )}

            {!user && job.status === 'open' && (
              <div className="text-center py-4">
                <p className="text-slate-600 mb-4">Sign in as an artisan to submit a quote</p>
                <Button onClick={() => setShowLogin(true)}>
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quote Submission Modal */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Quote</DialogTitle>
            <DialogDescription>
              {job.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Billing Type Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Pricing Type</Label>
                <p className="text-sm text-slate-500">
                  {quoteForm.billingType === 'fixed'
                    ? 'One fixed price for the entire job'
                    : 'Charge by the hour based on time worked'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${quoteForm.billingType === 'fixed' ? 'font-medium' : 'text-slate-400'}`}>
                  Fixed
                </span>
                <Switch
                  checked={quoteForm.billingType === 'hourly'}
                  onCheckedChange={(checked) =>
                    setQuoteForm({ ...quoteForm, billingType: checked ? 'hourly' : 'fixed' })
                  }
                />
                <span className={`text-sm ${quoteForm.billingType === 'hourly' ? 'font-medium' : 'text-slate-400'}`}>
                  Hourly
                </span>
              </div>
            </div>

            {quoteForm.billingType === 'fixed' ? (
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount (R)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={quoteForm.amount}
                  onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })}
                  className="h-11"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (R)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="0.00"
                    value={quoteForm.hourlyRate}
                    onChange={(e) => setQuoteForm({ ...quoteForm, hourlyRate: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    placeholder="0"
                    value={quoteForm.estimatedHours}
                    onChange={(e) => setQuoteForm({ ...quoteForm, estimatedHours: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add any additional details about your quote..."
                value={quoteForm.message}
                onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitQuote}
              disabled={submittingQuote}
              className="bg-secondary hover:bg-secondary/90"
            >
              {submittingQuote ? "Submitting..." : "Submit Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoginModal
        open={showLogin}
        onOpenChange={setShowLogin}
        onSwitchToSignup={() => {}}
      />
    </Layout>
  );
}
