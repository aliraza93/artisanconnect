import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin, Search, X, Briefcase, CheckCircle } from "lucide-react";
import { api, type Job, type Quote } from "@/lib/api";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/lib/auth-context";
import { LoginModal } from "@/components/auth/login-modal";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "plumber", label: "Plumbing" },
  { value: "electrician", label: "Electrical" },
  { value: "carpenter", label: "Building & Renovation" },
  { value: "painter", label: "Painting" },
  { value: "hvac", label: "HVAC" },
  { value: "welder", label: "Welding" },
  { value: "architect", label: "Architecture" },
  { value: "cctv", label: "CCTV & Security" },
  { value: "automation", label: "Home Automation" },
  { value: "solar", label: "Solar Installation" },
  { value: "generators", label: "Generators" },
  { value: "logistics", label: "Logistics & Transport" },
  { value: "general", label: "General Handyman" },
];

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

export default function FindWork() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<{[jobId: string]: Quote[]}>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [showLogin, setShowLogin] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedJobForQuote, setSelectedJobForQuote] = useState<Job | null>(null);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    billingType: 'fixed' as 'fixed' | 'hourly',
    amount: '',
    hourlyRate: '',
    estimatedHours: '',
    message: '',
  });
  const debouncedSearch = useDebounce(search, 300);

  useSEO({
    title: 'Find Work - Browse Open Jobs',
    description: 'Browse open job postings from clients. Find work opportunities in plumbing, electrical, building, and more.'
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { category?: string; search?: string } = {};
      if (category && category !== "all") {
        filters.category = category;
      }
      if (debouncedSearch.trim()) {
        filters.search = debouncedSearch.trim();
      }

      const data = await api.getOpenJobsPublic(Object.keys(filters).length > 0 ? filters : undefined);
      setJobs(data);

      // Fetch quotes for authenticated artisans
      if (user?.role === 'artisan' && user.verified) {
        try {
          const myQuotes = await api.getMyQuotes();
          const quotesMap: {[jobId: string]: Quote[]} = {};
          for (const quote of myQuotes) {
            if (!quotesMap[quote.jobId]) {
              quotesMap[quote.jobId] = [];
            }
            quotesMap[quote.jobId].push(quote);
          }
          setQuotes(quotesMap);
        } catch (error) {
          console.error("Failed to fetch quotes:", error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    const queryString = params.toString();
    window.history.replaceState({}, "", queryString ? `/find-work?${queryString}` : "/find-work");
  }, [category, search]);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get("category");
    const urlSearch = params.get("search");
    if (urlCategory) setCategory(urlCategory);
    if (urlSearch) setSearch(urlSearch);
  }, []);

  const clearFilters = () => {
    setCategory("all");
    setSearch("");
  };

  const hasActiveFilters = category !== "all" || search;

  const handleViewJob = (jobId: string) => {
    setLocation(`/job/${jobId}`);
  };

  const openQuoteModal = (job: Job) => {
    setSelectedJobForQuote(job);
    setShowQuoteModal(true);
  };

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

    if (!selectedJobForQuote) return;

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
        jobId: selectedJobForQuote.id,
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

      // Refresh quotes
      if (user?.role === 'artisan') {
        const myQuotes = await api.getMyQuotes();
        const quotesMap: {[jobId: string]: Quote[]} = {};
        for (const quote of myQuotes) {
          if (!quotesMap[quote.jobId]) {
            quotesMap[quote.jobId] = [];
          }
          quotesMap[quote.jobId].push(quote);
        }
        setQuotes(quotesMap);
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

  const handleQuoteClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (user.role !== 'artisan') {
      return;
    }
    openQuoteModal(job);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Layout>
      <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">Find Work</h1>
            <p className="text-slate-600">Browse open job opportunities</p>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-none shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search by job title..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="h-11"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        <Skeleton className="w-24 h-24 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500 text-lg mb-2">No jobs found</p>
                <p className="text-slate-400 text-sm">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "Check back later for new job postings"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-600">
                Found {jobs.length} job{jobs.length !== 1 ? "s" : ""}
              </div>
              <div className="space-y-4">
                {jobs.map((job) => {
                  const firstImage = job.images && job.images.length > 0 ? job.images[0] : null;
                  const hasQuoted = user?.role === 'artisan' && quotes[job.id]?.some(q => q.artisanId === user.id);
                  const userQuote = user?.role === 'artisan' ? quotes[job.id]?.find(q => q.artisanId === user.id) : null;
                  
                  return (
                    <div
                      key={job.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors gap-4"
                    >
                      <div className="flex gap-4 flex-1 cursor-pointer" onClick={() => handleViewJob(job.id)}>
                        {firstImage && (
                          <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border">
                            <img
                              src={firstImage}
                              alt={job.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                              {CATEGORIES.find(c => c.value === job.category)?.label || job.category}
                            </Badge>
                            {getStatusBadge(job.status)}
                            <span className="text-xs text-slate-400">{formatDate(job.createdAt)}</span>
                          </div>
                          <h3 className="font-bold text-slate-900">{job.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {job.budget && (
                            <div className="font-bold text-slate-700">R {job.budget}</div>
                          )}
                          {hasQuoted && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs mt-1">
                              <CheckCircle className="w-3 h-3 mr-1 inline" />
                              Quote Sent
                            </Badge>
                          )}
                          {userQuote && userQuote.status === 'accepted' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs mt-1">
                              Accepted
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewJob(job.id)}
                          >
                            View Details
                          </Button>
                          {user?.role === 'artisan' && !hasQuoted && job.status === 'open' && (
                            <Button
                              onClick={(e) => handleQuoteClick(e, job)}
                              className="bg-secondary hover:bg-secondary/90"
                            >
                              Submit Quote
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quote Submission Modal */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Quote</DialogTitle>
            <DialogDescription>
              {selectedJobForQuote?.title}
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
