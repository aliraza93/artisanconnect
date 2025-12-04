import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, DollarSign, MapPin, MessageSquare, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function Dashboard() {
  // Mock Data
  const activeJobs = [
    { id: 1, title: "Fix leaking tap in kitchen", category: "Plumbing", status: "Quotes Received", quotes: 3, date: "2 days ago" },
    { id: 2, title: "Transport rubble from renovation", category: "Logistics", status: "In Progress", quotes: 1, date: "1 week ago" },
  ];

  const quotes = [
    { 
      id: 1, 
      artisan: "Mike's Plumbing", 
      rating: 4.8, 
      amount: 850, 
      job: "Fix leaking tap in kitchen", 
      avatar: "MP",
      message: "Hi, I can come by tomorrow afternoon. Price includes new washer and labor." 
    },
    { 
      id: 2, 
      artisan: "Jozi Plumbers", 
      rating: 4.5, 
      amount: 950, 
      job: "Fix leaking tap in kitchen", 
      avatar: "JP",
      message: "Professional service guaranteed. 6 month warranty on workmanship." 
    },
  ];

  const mockChatMessages = [
    { id: 1, sender: "other", text: "Hi Sarah, I can be there at 9am.", time: "08:00 AM" },
    { id: 2, sender: "me", text: "That works perfectly. See you then.", time: "08:05 AM" },
  ];

  return (
    <Layout>
      <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">Welcome back, Sarah</h1>
              <p className="text-slate-500">Manage your jobs and quotes here.</p>
            </div>
            <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold shadow-md">
              + Post New Job
            </Button>
          </div>

          <Tabs defaultValue="overview">
             <TabsList className="mb-6">
               <TabsTrigger value="overview">Overview</TabsTrigger>
               <TabsTrigger value="messages">Messages</TabsTrigger>
             </TabsList>
             
             <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Stats & Active Jobs */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-slate-500 font-medium">Active Jobs</div>
                          <div className="text-3xl font-bold text-primary mt-2">2</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-slate-500 font-medium">Total Spent</div>
                          <div className="text-3xl font-bold text-slate-900 mt-2">R 4,200</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-sm text-slate-500 font-medium">Completed</div>
                          <div className="text-3xl font-bold text-green-600 mt-2">12</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Jobs Tab */}
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle>My Jobs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="active">
                          <TabsList className="mb-4">
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                          </TabsList>
                          <TabsContent value="active" className="space-y-4">
                            {activeJobs.map((job) => (
                              <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                      {job.category}
                                    </Badge>
                                    <span className="text-xs text-slate-400">{job.date}</span>
                                  </div>
                                  <h3 className="font-bold text-slate-900">{job.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <MapPin className="w-4 h-4" /> Sandton
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="font-bold text-primary">{job.status}</div>
                                    <div className="text-xs text-slate-500">{job.quotes} new quotes</div>
                                  </div>
                                  <Button variant="outline" size="sm">View</Button>
                                </div>
                              </div>
                            ))}
                          </TabsContent>
                          <TabsContent value="history">
                            <div className="text-center py-8 text-slate-500">
                              No history yet.
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Quotes & Notifications */}
                  <div className="space-y-8">
                    <Card className="border-none shadow-sm h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Recent Quotes
                          <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-none">2 New</Badge>
                        </CardTitle>
                        <CardDescription>Review and accept quotes for your active jobs.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {quotes.map((quote) => (
                          <div key={quote.id} className="p-4 border rounded-xl space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>{quote.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-bold text-sm">{quote.artisan}</div>
                                  <div className="flex items-center text-xs text-yellow-500">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="ml-1 font-medium text-slate-700">{quote.rating}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-lg font-bold text-slate-900">
                                R {quote.amount}
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic">
                              "{quote.message}"
                            </div>

                            <div className="flex gap-2">
                              <Button className="flex-1 bg-primary text-sm h-9">Accept</Button>
                              <Button variant="outline" className="flex-1 text-sm h-9">Decline</Button>
                            </div>
                            
                            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 pt-2 border-t">
                              <AlertCircle className="w-3 h-3" />
                              <span>20% Platform Fee included in total</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
             </TabsContent>

             <TabsContent value="messages">
               <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-3 gap-6 h-[600px]">
                     {/* Message List */}
                     <Card className="col-span-1 h-full border-none shadow-sm">
                        <CardHeader className="px-4 py-4">
                           <CardTitle>Messages</CardTitle>
                        </CardHeader>
                        <CardContent className="px-2">
                           <div className="space-y-2">
                              <div className="p-3 bg-slate-100 rounded-lg cursor-pointer">
                                 <div className="font-bold text-sm">Mike's Plumbing</div>
                                 <div className="text-xs text-slate-500 truncate">That works perfectly. See you then.</div>
                              </div>
                              <div className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer opacity-60">
                                 <div className="font-bold text-sm">ArtisanConnect Support</div>
                                 <div className="text-xs text-slate-500 truncate">Ticket #442 Resolved</div>
                              </div>
                           </div>
                        </CardContent>
                     </Card>

                     {/* Message View */}
                     <div className="col-span-2 h-full">
                        {/* @ts-ignore */}
                        <ChatInterface 
                           recipientName="Mike's Plumbing"
                           recipientRole="Artisan"
                           recipientAvatar="MP"
                           // @ts-ignore
                           messages={mockChatMessages}
                           onSendMessage={() => {}}
                        />
                     </div>
                  </div>
               </div>
             </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
