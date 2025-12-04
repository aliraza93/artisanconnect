import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, AlertCircle, Plus, Briefcase, Clock, CheckCircle } from "lucide-react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useAuth } from "@/lib/auth-context";
import { api, type Job, type Quote } from "@/lib/api";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<{[jobId: string]: Quote[]}>({});
  const [loading, setLoading] = useState(true);
  const [selectedJobForQuotes, setSelectedJobForQuotes] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'client' || user?.role === 'admin') {
        const myJobs = await api.getMyJobs();
        setJobs(myJobs);
        
        // Fetch quotes for each job
        const quotesMap: {[jobId: string]: Quote[]} = {};
        for (const job of myJobs) {
          const jobQuotes = await api.getJobQuotes(job.id);
          quotesMap[job.id] = jobQuotes;
        }
        setQuotes(quotesMap);
      } else if (user?.role === 'artisan') {
        // Artisans see open jobs they can quote on
        const openJobs = await api.getOpenJobs();
        setJobs(openJobs);
        
        // Also fetch their submitted quotes
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
      console.error('Failed to fetch data:', error);
      toast({
        title: "Failed to load data",
        description: error.message || "Could not load your dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      await api.acceptQuote(quoteId);
      toast({
        title: "Quote Accepted!",
        description: "The artisan has been notified and payment is held in escrow.",
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Failed to accept quote",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: {[key: string]: string} = {
      'open': 'bg-blue-100 text-blue-700',
      'quoted': 'bg-yellow-100 text-yellow-700',
      'in_progress': 'bg-purple-100 text-purple-700',
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-gray-100 text-gray-700',
      'disputed': 'bg-red-100 text-red-700',
    };
    
    const statusLabels: {[key: string]: string} = {
      'open': 'Open',
      'quoted': 'Quotes Received',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'disputed': 'Disputed',
    };

    return (
      <Badge className={`${statusStyles[status] || statusStyles['open']} border-none`}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const activeJobs = jobs.filter(j => ['open', 'quoted', 'in_progress'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');
  
  // Get all quotes across all jobs for the quotes panel
  const allQuotes = Object.entries(quotes).flatMap(([jobId, jobQuotes]) => 
    jobQuotes.map(q => ({
      ...q,
      jobTitle: jobs.find(j => j.id === jobId)?.title || 'Unknown Job'
    }))
  ).filter(q => q.status === 'pending');

  const stats = {
    activeJobs: activeJobs.length,
    totalQuotes: allQuotes.length,
    completedJobs: completedJobs.length,
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900" data-testid="text-welcome">
                Welcome back, {user.fullName.split(' ')[0]}
              </h1>
              <p className="text-slate-500">
                {user.role === 'client' ? 'Manage your jobs and quotes here.' : 
                 user.role === 'artisan' ? 'Find jobs and manage your quotes.' :
                 'Monitor platform activity.'}
              </p>
            </div>
            {user.role === 'client' && (
              <Button 
                onClick={() => setLocation('/post-job')}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold shadow-md"
                data-testid="button-post-new-job"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
            )}
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
            </TabsList>
             
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Jobs */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <Briefcase className="w-4 h-4" />
                          Active Jobs
                        </div>
                        <div className="text-3xl font-bold text-primary mt-2" data-testid="stat-active-jobs">
                          {loading ? <Skeleton className="h-9 w-8" /> : stats.activeJobs}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <Clock className="w-4 h-4" />
                          Pending Quotes
                        </div>
                        <div className="text-3xl font-bold text-yellow-600 mt-2" data-testid="stat-quotes">
                          {loading ? <Skeleton className="h-9 w-8" /> : stats.totalQuotes}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </div>
                        <div className="text-3xl font-bold text-green-600 mt-2" data-testid="stat-completed">
                          {loading ? <Skeleton className="h-9 w-8" /> : stats.completedJobs}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Jobs List */}
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle>
                        {user.role === 'client' ? 'My Jobs' : 'Available Jobs'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="active">
                        <TabsList className="mb-4">
                          <TabsTrigger value="active">Active</TabsTrigger>
                          <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>
                        <TabsContent value="active" className="space-y-4">
                          {loading ? (
                            <>
                              <Skeleton className="h-24" />
                              <Skeleton className="h-24" />
                            </>
                          ) : activeJobs.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                              {user.role === 'client' ? (
                                <>
                                  <p>No active jobs yet.</p>
                                  <Button 
                                    onClick={() => setLocation('/post-job')}
                                    className="mt-4"
                                  >
                                    Post Your First Job
                                  </Button>
                                </>
                              ) : (
                                <p>No open jobs available at the moment.</p>
                              )}
                            </div>
                          ) : (
                            activeJobs.map((job) => (
                              <div 
                                key={job.id} 
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors gap-4"
                                data-testid={`job-card-${job.id}`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                      {job.category}
                                    </Badge>
                                    {getStatusBadge(job.status)}
                                    <span className="text-xs text-slate-400">{formatDate(job.createdAt)}</span>
                                  </div>
                                  <h3 className="font-bold text-slate-900">{job.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <MapPin className="w-4 h-4" /> {job.location}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    {job.budget && (
                                      <div className="font-bold text-slate-700">R {job.budget}</div>
                                    )}
                                    {quotes[job.id]?.length > 0 && (
                                      <div className="text-xs text-slate-500">
                                        {quotes[job.id].filter(q => q.status === 'pending').length} pending quotes
                                      </div>
                                    )}
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedJobForQuotes(job.id)}
                                    data-testid={`button-view-job-${job.id}`}
                                  >
                                    View
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </TabsContent>
                        <TabsContent value="history">
                          {loading ? (
                            <Skeleton className="h-24" />
                          ) : completedJobs.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                              No completed jobs yet.
                            </div>
                          ) : (
                            completedJobs.map((job) => (
                              <div 
                                key={job.id} 
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-4 opacity-75"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                                      Completed
                                    </Badge>
                                    <span className="text-xs text-slate-400">{formatDate(job.createdAt)}</span>
                                  </div>
                                  <h3 className="font-bold text-slate-900">{job.title}</h3>
                                </div>
                              </div>
                            ))
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Quotes */}
                <div className="space-y-8">
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {user.role === 'client' ? 'Recent Quotes' : 'My Quotes'}
                        {allQuotes.length > 0 && (
                          <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-none">
                            {allQuotes.length} New
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {user.role === 'client' 
                          ? 'Review and accept quotes for your active jobs.'
                          : 'Track your submitted quotes.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loading ? (
                        <>
                          <Skeleton className="h-40" />
                          <Skeleton className="h-40" />
                        </>
                      ) : allQuotes.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <p>No quotes yet.</p>
                        </div>
                      ) : (
                        allQuotes.slice(0, 5).map((quote) => (
                          <div key={quote.id} className="p-4 border rounded-xl space-y-4" data-testid={`quote-card-${quote.id}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {quote.artisanId.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-bold text-sm">Artisan</div>
                                  <div className="text-xs text-slate-500">{quote.jobTitle}</div>
                                </div>
                              </div>
                              <div className="text-lg font-bold text-slate-900">
                                R {parseFloat(quote.amount).toLocaleString()}
                              </div>
                            </div>
                            
                            {quote.message && (
                              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic">
                                "{quote.message}"
                              </div>
                            )}

                            {user.role === 'client' && (
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1 bg-primary text-sm h-9"
                                  onClick={() => handleAcceptQuote(quote.id)}
                                  data-testid={`button-accept-quote-${quote.id}`}
                                >
                                  Accept
                                </Button>
                                <Button variant="outline" className="flex-1 text-sm h-9">
                                  Decline
                                </Button>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 pt-2 border-t">
                              <AlertCircle className="w-3 h-3" />
                              <span>20% Platform Fee included in total</span>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages">
              <div className="max-w-4xl mx-auto">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>Chat with artisans and support</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-slate-500">
                      <p>No messages yet.</p>
                      <p className="text-sm mt-2">Messages will appear here once you start communicating with artisans.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
