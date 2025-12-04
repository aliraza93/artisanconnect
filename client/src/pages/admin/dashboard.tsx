import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Input } from "@/components/ui/input";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  Bell, 
  Settings,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  // Mock Data
  const disputes = [
    { id: 1, user: "Sarah Jenkins", artisan: "Mike's Plumbing", issue: "Job not completed to spec", status: "Open", severity: "High" },
    { id: 2, user: "John Doe", artisan: "Fast Movers", issue: "Item damaged in transit", status: "Investigating", severity: "Medium" },
  ];

  const activeChats = [
    { id: 101, client: "Sarah Jenkins", artisan: "Mike's Plumbing", lastMsg: "When can you arrive?", time: "2m ago", status: "Active" },
    { id: 102, client: "David Smith", artisan: "Electric Pro", lastMsg: "Quote accepted.", time: "15m ago", status: "Active" },
    { id: 103, client: "Support Ticket #442", artisan: "Admin Support", lastMsg: "Refund processed.", time: "1h ago", status: "Resolved" },
  ];

  const mockChatMessages = [
    { id: 1, sender: "other", text: "Hi Mike, are you still coming at 2pm?", time: "10:30 AM" },
    { id: 2, sender: "me", text: "Yes, running a bit late. Maybe 2:30?", time: "10:35 AM" },
    { id: 3, sender: "other", text: "That works. Please bring the invoice.", time: "10:36 AM" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 font-heading font-bold text-xl">
            <div className="bg-primary p-1 rounded text-white">A</div>
            <span>AdminPanel</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Button 
            variant={activeTab === "overview" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </Button>
          <Button 
            variant={activeTab === "users" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("users")}
          >
            <Users className="w-4 h-4" /> Users & Artisans
          </Button>
          <Button 
            variant={activeTab === "chats" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("chats")}
          >
            <MessageSquare className="w-4 h-4" /> Live Chats & Support
          </Button>
          <Button 
            variant={activeTab === "disputes" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("disputes")}
          >
            <AlertTriangle className="w-4 h-4" /> Disputes Center
          </Button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white">
              <LogOut className="w-4 h-4" /> Exit to Site
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-slate-500 text-sm">Dashboard / <span className="text-slate-900 font-medium capitalize">{activeTab}</span></div>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon">
               <Bell className="w-5 h-5 text-slate-500" />
             </Button>
             <Avatar className="h-8 w-8">
               <AvatarFallback className="bg-primary text-white">AD</AvatarFallback>
             </Avatar>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-slate-500">Total Revenue</div>
                      <div className="text-2xl font-bold text-slate-900 mt-2">R 124,500</div>
                      <div className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" /> +12% this month
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-slate-500">Active Jobs</div>
                      <div className="text-2xl font-bold text-slate-900 mt-2">48</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-slate-500">Open Disputes</div>
                      <div className="text-2xl font-bold text-red-600 mt-2">3</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm text-slate-500">New Users</div>
                      <div className="text-2xl font-bold text-slate-900 mt-2">156</div>
                    </CardContent>
                  </Card>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                       <CardTitle>Recent Disputes</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-4">
                          {disputes.map((d) => (
                            <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                               <div>
                                 <div className="font-medium text-sm">{d.user} vs {d.artisan}</div>
                                 <div className="text-xs text-slate-500">{d.issue}</div>
                               </div>
                               <Badge variant={d.severity === "High" ? "destructive" : "outline"}>{d.status}</Badge>
                            </div>
                          ))}
                       </div>
                    </CardContent>
                  </Card>
               </div>
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
          
          {/* Placeholder for other tabs */}
          {(activeTab === "users" || activeTab === "disputes") && (
            <div className="flex items-center justify-center h-full text-slate-400">
              Work in progress module
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
