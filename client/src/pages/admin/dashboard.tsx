import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  Bell, 
  Wallet,
  ArrowUpRight,
  Download,
  LogOut,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { api, type Dispute } from "@/lib/api";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  
  // Real data states
  const [revenue, setRevenue] = useState<number>(0);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to access this page",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user, authLoading]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [revenueData, disputesData] = await Promise.all([
        api.getPlatformRevenue(),
        api.getDisputes(),
      ]);
      setRevenue(revenueData.revenue);
      setDisputes(disputesData);
    } catch (error: any) {
      console.error('Failed to fetch admin data:', error);
      toast({
        title: "Failed to load data",
        description: error.message || "Could not load admin dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Withdrawal Initiated",
      description: `Your request to withdraw R ${withdrawAmount} has been processed. Funds will reflect in 1-3 business days.`,
    });
    setWithdrawAmount("");
  };

  const handleResolveDispute = async (disputeId: string) => {
    try {
      await api.updateDispute(disputeId, { status: 'resolved', resolvedAt: new Date().toISOString() });
      toast({
        title: "Dispute Resolved",
        description: "The dispute has been marked as resolved.",
      });
      fetchAdminData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive",
      });
    }
  };

  // Mock data for chat (would be replaced with real messaging in production)
  const activeChats = [
    { id: 101, client: "Sarah Jenkins", artisan: "Mike's Plumbing", lastMsg: "When can you arrive?", time: "2m ago", status: "Active" },
    { id: 102, client: "David Smith", artisan: "Electric Pro", lastMsg: "Quote accepted.", time: "15m ago", status: "Active" },
  ];

  const mockChatMessages = [
    { id: 1, sender: "other", text: "Hi Mike, are you still coming at 2pm?", time: "10:30 AM" },
    { id: 2, sender: "me", text: "Yes, running a bit late. Maybe 2:30?", time: "10:35 AM" },
    { id: 3, sender: "other", text: "That works. Please bring the invoice.", time: "10:36 AM" },
  ];

  // Mock transaction data (would come from payments API in production)
  const transactions = [
    { id: "TXN-1001", date: "2025-12-04", type: "Platform Fee", amount: revenue, status: "Completed", job: "All Jobs" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 font-heading font-bold text-xl">
            <div className="bg-primary p-1 rounded text-white">
              <Shield className="w-5 h-5" />
            </div>
            <span>Admin Panel</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Button 
            variant={activeTab === "overview" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("overview")}
            data-testid="nav-overview"
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </Button>
          <Button 
            variant={activeTab === "financials" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("financials")}
            data-testid="nav-financials"
          >
            <Wallet className="w-4 h-4" /> Financials & Payouts
          </Button>
          <Button 
            variant={activeTab === "users" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("users")}
            data-testid="nav-users"
          >
            <Users className="w-4 h-4" /> Users & Artisans
          </Button>
          <Button 
            variant={activeTab === "chats" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("chats")}
            data-testid="nav-chats"
          >
            <MessageSquare className="w-4 h-4" /> Live Chats & Support
          </Button>
          <Button 
            variant={activeTab === "disputes" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("disputes")}
            data-testid="nav-disputes"
          >
            <AlertTriangle className="w-4 h-4" /> Disputes Center
          </Button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white">
              <LayoutDashboard className="w-4 h-4" /> Back to Site
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-400 hover:text-white"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-slate-500 text-sm">
            Dashboard / <span className="text-slate-900 font-medium capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5 text-slate-500" />
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white">
                  {user.fullName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">{user.fullName}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500">Platform Revenue</div>
                    {loading ? (
                      <Skeleton className="h-8 w-24 mt-2" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-slate-900 mt-2" data-testid="stat-revenue">
                          R {revenue.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 mr-1" /> 20% of transactions
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500">Open Disputes</div>
                    {loading ? (
                      <Skeleton className="h-8 w-12 mt-2" />
                    ) : (
                      <div className="text-2xl font-bold text-red-600 mt-2" data-testid="stat-disputes">
                        {disputes.filter(d => d.status === 'open').length}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500">Active Users</div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">3</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500">Total Disputes</div>
                    {loading ? (
                      <Skeleton className="h-8 w-12 mt-2" />
                    ) : (
                      <div className="text-2xl font-bold text-slate-900 mt-2">{disputes.length}</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Disputes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                      </div>
                    ) : disputes.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No disputes to show
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {disputes.slice(0, 5).map((d) => (
                          <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <div className="font-medium text-sm">Dispute #{d.id.substring(0, 8)}</div>
                              <div className="text-xs text-slate-500">{d.issue}</div>
                            </div>
                            <Badge 
                              variant={d.status === "open" ? "destructive" : "outline"}
                              className={d.status === "resolved" ? "bg-green-50 text-green-700" : ""}
                            >
                              {d.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setActiveTab("disputes")}>
                      <AlertTriangle className="w-4 h-4" /> Review Disputes
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setActiveTab("financials")}>
                      <Wallet className="w-4 h-4" /> View Financials
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setActiveTab("chats")}>
                      <MessageSquare className="w-4 h-4" /> Monitor Chats
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "financials" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Available Balance</CardTitle>
                    <CardDescription>Platform revenue available for withdrawal</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      {loading ? (
                        <Skeleton className="h-12 w-40" />
                      ) : (
                        <>
                          <div className="text-4xl font-bold text-slate-900">R {revenue.toLocaleString()}</div>
                          <div className="text-sm text-slate-500 mt-1">Cleared funds ready for payout</div>
                        </>
                      )}
                    </div>
                    <div className="space-y-4 w-full md:w-auto">
                      <form onSubmit={handleWithdraw} className="flex gap-2">
                        <div className="flex-1 min-w-[150px]">
                          <Input 
                            placeholder="Amount" 
                            type="number" 
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            required
                            data-testid="input-withdraw-amount"
                          />
                        </div>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700" data-testid="button-withdraw">
                          Withdraw Funds
                        </Button>
                      </form>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        <span>Payout to: FNB Business Account (**** 4552)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-none">
                  <CardHeader>
                    <CardTitle className="text-white">Commission Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold opacity-90">20%</div>
                    <p className="text-slate-400 text-sm mt-2">Platform fee on all completed transactions</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Transaction History</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Transaction ID</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn) => (
                          <tr key={txn.id} className="border-t">
                            <td className="p-4">{txn.date}</td>
                            <td className="p-4 font-mono text-slate-500">{txn.id}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {txn.type === "Withdrawal" ? (
                                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px] font-bold">P</div>
                                )}
                                {txn.type}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                                {txn.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-right font-bold text-green-600">
                              + R {txn.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "disputes" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Disputes</CardTitle>
                  <CardDescription>Review and resolve customer disputes</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                    </div>
                  ) : disputes.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No disputes to review</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {disputes.map((dispute) => (
                        <div key={dispute.id} className="p-4 border rounded-xl space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold">Dispute #{dispute.id.substring(0, 8)}</div>
                              <div className="text-sm text-slate-600 mt-1">{dispute.issue}</div>
                              {dispute.description && (
                                <p className="text-sm text-slate-500 mt-2">{dispute.description}</p>
                              )}
                            </div>
                            <Badge 
                              variant={dispute.status === "open" ? "destructive" : "outline"}
                              className={dispute.status === "resolved" ? "bg-green-50 text-green-700" : ""}
                            >
                              {dispute.status}
                            </Badge>
                          </div>
                          {dispute.status === 'open' && (
                            <div className="flex gap-2 pt-2 border-t">
                              <Button 
                                size="sm" 
                                onClick={() => handleResolveDispute(dispute.id)}
                                data-testid={`button-resolve-${dispute.id}`}
                              >
                                Mark Resolved
                              </Button>
                              <Button size="sm" variant="outline">
                                Investigate
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "chats" && (
            <div className="grid grid-cols-12 gap-6 h-full">
              {/* Chat List */}
              <Card className="col-span-4 flex flex-col h-full border-none shadow-md">
                <CardHeader className="px-4 py-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search conversations..." className="pl-8" />
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {activeChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${
                          selectedChat === chat.id ? "bg-slate-100" : "hover:bg-slate-50"
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{chat.client[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm truncate">{chat.client} & {chat.artisan}</span>
                            <span className="text-[10px] text-slate-400">{chat.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{chat.lastMsg}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              {/* Chat View */}
              <div className="col-span-8 h-full">
                {selectedChat ? (
                  // @ts-ignore
                  <ChatInterface 
                    recipientName="Sarah Jenkins (Client) & Mike's Plumbing (Artisan)"
                    recipientRole="Live Conversation"
                    recipientAvatar="SJ"
                    // @ts-ignore
                    messages={mockChatMessages}
                    onSendMessage={() => {}}
                    isAdminView={true}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-4 border-2 border-dashed rounded-xl">
                    <MessageSquare className="h-12 w-12 opacity-20" />
                    <p>Select a conversation to monitor or intervene</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === "users" && (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>User management coming soon</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
