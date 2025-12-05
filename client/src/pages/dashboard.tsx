import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin, Star, AlertCircle, Plus, Briefcase, Clock, CheckCircle, DollarSign } from "lucide-react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useAuth } from "@/lib/auth-context";
import { api, type Job, type Quote, type Payment } from "@/lib/api";
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
  const [payments, setPayments] = useState<{[jobId: string]: Payment[]}>({});
  const [loading, setLoading] = useState(true);
  const [selectedJobForQuotes, setSelectedJobForQuotes] = useState<string | null>(null);
  
  // Quote submission modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedJobForQuote, setSelectedJobForQuote] = useState<Job | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    billingType: 'fixed' as 'fixed' | 'hourly',
    amount: '',
    hourlyRate: '',
    estimatedHours: '',
    message: '',
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);
  
  // Job completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedPaymentForCompletion, setSelectedPaymentForCompletion] = useState<Payment | null>(null);
  const [actualHours, setActualHours] = useState('');
  const [completionStep, setCompletionStep] = useState<'hours' | 'confirm'>('hours');
  const [calculatedPayout, setCalculatedPayout] = useState<any>(null);
  const [processingCompletion, setProcessingCompletion] = useState(false);

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
        
        // Fetch quotes and payments for each job
        const quotesMap: {[jobId: string]: Quote[]} = {};
        const paymentsMap: {[jobId: string]: Payment[]} = {};
        for (const job of myJobs) {
          const jobQuotes = await api.getJobQuotes(job.id);
          quotesMap[job.id] = jobQuotes;
          
          if (job.status === 'in_progress' || job.status === 'completed') {
            const jobPayments = await api.getJobPayments(job.id);
            paymentsMap[job.id] = jobPayments;
          }
        }
        setQuotes(quotesMap);
        setPayments(paymentsMap);
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

  const openQuoteModal = (job: Job) => {
    setSelectedJobForQuote(job);
    setQuoteForm({
      billingType: 'fixed',
      amount: '',
      hourlyRate: '',
      estimatedHours: '',
      message: '',
    });
    setShowQuoteModal(true);
  };

  const handleSubmitQuote = async () => {
    if (!selectedJobForQuote) return;
    
    setSubmittingQuote(true);
    try {
      const quoteData: any = {
        jobId: selectedJobForQuote.id,
        billingType: quoteForm.billingType,
        message: quoteForm.message || undefined,
      };
      
      if (quoteForm.billingType === 'fixed') {
        if (!quoteForm.amount || parseFloat(quoteForm.amount) <= 0) {
          toast({
            title: "Invalid amount",
            description: "Please enter a valid quote amount",
            variant: "destructive",
          });
          setSubmittingQuote(false);
          return;
        }
        quoteData.amount = quoteForm.amount;
      } else {
        if (!quoteForm.hourlyRate || parseFloat(quoteForm.hourlyRate) <= 0) {
          toast({
            title: "Invalid hourly rate",
            description: "Please enter a valid hourly rate",
            variant: "destructive",
          });
          setSubmittingQuote(false);
          return;
        }
        if (!quoteForm.estimatedHours || parseFloat(quoteForm.estimatedHours) <= 0) {
          toast({
            title: "Invalid estimated hours",
            description: "Please enter valid estimated hours",
            variant: "destructive",
          });
          setSubmittingQuote(false);
          return;
        }
        quoteData.hourlyRate = quoteForm.hourlyRate;
        quoteData.estimatedHours = quoteForm.estimatedHours;
      }
      
      await api.createQuote(quoteData);
      
      toast({
        title: "Quote Submitted!",
        description: "Your quote has been sent to the client.",
      });
      
      setShowQuoteModal(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Failed to submit quote",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmittingQuote(false);
    }
  };

  const openCompletionModal = (payment: Payment) => {
    setSelectedPaymentForCompletion(payment);
    setActualHours(payment.estimatedHours || '');
    setCompletionStep('hours');
    setCalculatedPayout(null);
    setShowCompletionModal(true);
  };

  const handleRecordHours = async () => {
    if (!selectedPaymentForCompletion || !actualHours) return;
    
    setProcessingCompletion(true);
    try {
      const result = await api.recordActualHours(selectedPaymentForCompletion.id, actualHours);
      setCalculatedPayout(result.summary);
      setCompletionStep('confirm');
    } catch (error: any) {
      toast({
        title: "Failed to record hours",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setProcessingCompletion(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!selectedPaymentForCompletion) return;
    
    setProcessingCompletion(true);
    try {
      const result = await api.releasePayment(selectedPaymentForCompletion.id);
      
      toast({
        title: "Payment Released!",
        description: result.message,
      });
      
      setShowCompletionModal(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Failed to release payment",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setProcessingCompletion(false);
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

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `R ${num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateEstimatedTotal = () => {
    if (quoteForm.billingType === 'fixed') {
      return quoteForm.amount ? parseFloat(quoteForm.amount) : 0;
    }
    const rate = parseFloat(quoteForm.hourlyRate) || 0;
    const hours = parseFloat(quoteForm.estimatedHours) || 0;
    return rate * hours;
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

  // Get jobs in progress with payments (for client completion flow)
  const inProgressJobs = jobs.filter(j => j.status === 'in_progress');

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

                  {/* In Progress Jobs (Client) - Job Completion Section */}
                  {user.role === 'client' && inProgressJobs.length > 0 && (
                    <Card className="border-none shadow-sm border-l-4 border-l-purple-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-500" />
                          Jobs In Progress
                        </CardTitle>
                        <CardDescription>
                          Complete these jobs by recording actual hours worked and releasing payment.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {inProgressJobs.map((job) => {
                          const jobPayment = payments[job.id]?.[0];
                          return (
                            <div 
                              key={job.id}
                              className="p-4 border rounded-xl bg-purple-50/50"
                              data-testid={`inprogress-job-${job.id}`}
                            >
                              <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div>
                                  <h3 className="font-bold text-slate-900">{job.title}</h3>
                                  <div className="text-sm text-slate-500 mt-1">
                                    {jobPayment?.billingType === 'hourly' ? (
                                      <span className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Hourly: {formatCurrency(jobPayment.hourlyRate || '0')}/hr × {jobPayment.estimatedHours} hrs (estimated)
                                      </span>
                                    ) : (
                                      <span>Fixed Price: {formatCurrency(jobPayment?.totalAmount || '0')}</span>
                                    )}
                                  </div>
                                  {jobPayment?.actualHours && (
                                    <div className="text-sm text-green-600 mt-1">
                                      Actual hours recorded: {jobPayment.actualHours} hrs = {formatCurrency(jobPayment.finalTotal || '0')}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {jobPayment?.billingType === 'hourly' && !jobPayment.actualHours ? (
                                    <Button
                                      onClick={() => openCompletionModal(jobPayment)}
                                      className="bg-purple-600 hover:bg-purple-700"
                                      data-testid={`button-complete-job-${job.id}`}
                                    >
                                      Record Hours & Pay
                                    </Button>
                                  ) : jobPayment?.billingType === 'hourly' && jobPayment.actualHours ? (
                                    <Button
                                      onClick={() => handleReleasePayment()}
                                      className="bg-green-600 hover:bg-green-700"
                                      data-testid={`button-release-payment-${job.id}`}
                                    >
                                      Release Payment
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={async () => {
                                        if (jobPayment) {
                                          setProcessingCompletion(true);
                                          try {
                                            const result = await api.releasePayment(jobPayment.id);
                                            toast({
                                              title: "Payment Released!",
                                              description: result.message,
                                            });
                                            fetchData();
                                          } catch (error: any) {
                                            toast({
                                              title: "Failed to release payment",
                                              description: error.message,
                                              variant: "destructive",
                                            });
                                          } finally {
                                            setProcessingCompletion(false);
                                          }
                                        }
                                      }}
                                      className="bg-green-600 hover:bg-green-700"
                                      disabled={processingCompletion}
                                      data-testid={`button-release-fixed-${job.id}`}
                                    >
                                      {processingCompletion ? 'Processing...' : 'Mark Complete & Pay'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

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
                            activeJobs.map((job) => {
                              const hasQuoted = user.role === 'artisan' && quotes[job.id]?.some(q => q.artisanId === user.id);
                              return (
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
                                      {quotes[job.id]?.length > 0 && user.role === 'client' && (
                                        <div className="text-xs text-slate-500">
                                          {quotes[job.id].filter(q => q.status === 'pending').length} pending quotes
                                        </div>
                                      )}
                                      {hasQuoted && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                          Quote Sent
                                        </Badge>
                                      )}
                                    </div>
                                    {user.role === 'artisan' && !hasQuoted && job.status === 'open' && (
                                      <Button 
                                        onClick={() => openQuoteModal(job)}
                                        className="bg-secondary hover:bg-secondary/90"
                                        data-testid={`button-submit-quote-${job.id}`}
                                      >
                                        Submit Quote
                                      </Button>
                                    )}
                                    {user.role === 'client' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setSelectedJobForQuotes(job.id)}
                                        data-testid={`button-view-job-${job.id}`}
                                      >
                                        View
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
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
                              <div className="text-right">
                                <div className="text-lg font-bold text-slate-900">
                                  {formatCurrency(quote.amount)}
                                </div>
                                {quote.billingType === 'hourly' && (
                                  <div className="text-xs text-purple-600">
                                    {formatCurrency(quote.hourlyRate || '0')}/hr × {quote.estimatedHours} hrs
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Billing type badge */}
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={quote.billingType === 'hourly' 
                                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                                }
                              >
                                {quote.billingType === 'hourly' ? (
                                  <><Clock className="w-3 h-3 mr-1" /> Hourly Rate</>
                                ) : (
                                  <><DollarSign className="w-3 h-3 mr-1" /> Fixed Price</>
                                )}
                              </Badge>
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
                              <span>
                                {quote.billingType === 'hourly' 
                                  ? 'Final amount based on actual hours worked. 20% platform fee applies.'
                                  : '20% Platform Fee included in total'
                                }
                              </span>
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
                  data-testid="switch-billing-type"
                />
                <span className={`text-sm ${quoteForm.billingType === 'hourly' ? 'font-medium' : 'text-slate-400'}`}>
                  Hourly
                </span>
              </div>
            </div>

            {quoteForm.billingType === 'fixed' ? (
              <div className="space-y-2">
                <Label htmlFor="amount">Quote Amount (R)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 2500"
                  value={quoteForm.amount}
                  onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })}
                  data-testid="input-quote-amount"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (R/hour)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 350"
                    value={quoteForm.hourlyRate}
                    onChange={(e) => setQuoteForm({ ...quoteForm, hourlyRate: e.target.value })}
                    data-testid="input-hourly-rate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g., 4"
                    value={quoteForm.estimatedHours}
                    onChange={(e) => setQuoteForm({ ...quoteForm, estimatedHours: e.target.value })}
                    data-testid="input-estimated-hours"
                  />
                </div>
              </>
            )}

            {/* Estimated Total Display */}
            {calculateEstimatedTotal() > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    {quoteForm.billingType === 'hourly' ? 'Estimated Total' : 'Total Quote'}
                  </span>
                  <span className="text-xl font-bold text-green-700">
                    {formatCurrency(calculateEstimatedTotal())}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Platform fee (20%): {formatCurrency(calculateEstimatedTotal() * 0.2)}
                  {' • '}
                  You receive: {formatCurrency(calculateEstimatedTotal() * 0.8)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Describe your approach, timeline, or any questions..."
                value={quoteForm.message}
                onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                data-testid="input-quote-message"
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
              data-testid="button-confirm-submit-quote"
            >
              {submittingQuote ? 'Submitting...' : 'Submit Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Completion Modal (for hourly billing) */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {completionStep === 'hours' ? 'Record Actual Hours' : 'Confirm Payment'}
            </DialogTitle>
            <DialogDescription>
              {completionStep === 'hours' 
                ? 'Enter the actual hours worked to calculate the final payment.'
                : 'Review and confirm the payment to complete the job.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {completionStep === 'hours' ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Hourly Rate:</span>
                  <span className="font-medium">{formatCurrency(selectedPaymentForCompletion?.hourlyRate || '0')}/hr</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estimated Hours:</span>
                  <span className="font-medium">{selectedPaymentForCompletion?.estimatedHours} hrs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estimated Total:</span>
                  <span className="font-medium">{formatCurrency(selectedPaymentForCompletion?.totalAmount || '0')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualHours">Actual Hours Worked</Label>
                <Input
                  id="actualHours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g., 5.5"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  data-testid="input-actual-hours"
                />
                <p className="text-xs text-slate-500">
                  Enter the actual time the artisan spent on the job.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-50 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Hourly Rate:</span>
                  <span className="font-medium">{formatCurrency(calculatedPayout?.hourlyRate || 0)}/hr</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Actual Hours:</span>
                  <span className="font-medium">{calculatedPayout?.actualHours} hrs</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Final Total:</span>
                    <span className="text-green-700">{formatCurrency(calculatedPayout?.finalTotal || '0')}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Platform Fee (20%):</span>
                    <span>{formatCurrency(calculatedPayout?.platformFee || '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Artisan Receives:</span>
                    <span>{formatCurrency(calculatedPayout?.artisanAmount || '0')}</span>
                  </div>
                </div>
              </div>

              {parseFloat(calculatedPayout?.actualHours || '0') !== parseFloat(selectedPaymentForCompletion?.estimatedHours || '0') && (
                <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  The actual hours ({calculatedPayout?.actualHours}) differ from the estimate ({selectedPaymentForCompletion?.estimatedHours}).
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionModal(false)}>
              Cancel
            </Button>
            {completionStep === 'hours' ? (
              <Button 
                onClick={handleRecordHours} 
                disabled={processingCompletion || !actualHours}
                data-testid="button-calculate-payout"
              >
                {processingCompletion ? 'Calculating...' : 'Calculate Payout'}
              </Button>
            ) : (
              <Button 
                onClick={handleReleasePayment} 
                disabled={processingCompletion}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-confirm-release-payment"
              >
                {processingCompletion ? 'Processing...' : 'Release Payment'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
