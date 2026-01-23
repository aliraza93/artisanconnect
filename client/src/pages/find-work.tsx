import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, X, Briefcase } from "lucide-react";
import { api, type Job } from "@/lib/api";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/lib/auth-context";
import { LoginModal } from "@/components/auth/login-modal";

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

export default function FindWork() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [showLogin, setShowLogin] = useState(false);
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
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch]);

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

  const handleSubmitQuote = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (user.role !== 'artisan') {
      return;
    }
    // Navigate to job details page where quote submission will be handled
    setLocation(`/job/${job.id}`);
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
                        <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
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
                  return (
                    <Card
                      key={job.id}
                      className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewJob(job.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex gap-4 flex-1">
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
                                <span className="text-xs text-slate-400">{formatDate(job.createdAt)}</span>
                              </div>
                              <h3 className="font-bold text-slate-900 text-lg">{job.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <MapPin className="w-4 h-4" />
                                <span>{job.location}</span>
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-2 mt-2">{job.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:items-end gap-3">
                            {job.budget && (
                              <div className="font-bold text-slate-700 text-lg">R {job.budget}</div>
                            )}
                            <Button
                              onClick={(e) => handleSubmitQuote(e, job)}
                              className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto"
                              disabled={user?.role !== 'artisan'}
                            >
                              <Briefcase className="w-4 h-4 mr-2" />
                              Submit Quote
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <LoginModal
        open={showLogin}
        onOpenChange={setShowLogin}
        onSwitchToSignup={() => {}}
      />
    </Layout>
  );
}
