import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ArrowLeft, MessageCircle, Circle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWebSocket } from "@/lib/websocket";
import { api, type Message } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  recipientId: string;
  recipientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function Messages() {
  const params = useParams<{ userId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isConnected, sendMessage: wsSendMessage, typingUsers } = useWebSocket();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(params.userId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedUserId && user) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      const grouped = groupConversations(data);
      setConversations(grouped);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupConversations = (messages: Message[]): Conversation[] => {
    const convMap = new Map<string, Conversation>();
    
    messages.forEach(msg => {
      const recipientId = msg.senderId === user?.id ? msg.recipientId : msg.senderId;
      const existing = convMap.get(recipientId);
      
      if (!existing || new Date(msg.createdAt) > new Date(existing.lastMessageTime)) {
        convMap.set(recipientId, {
          id: recipientId,
          recipientId,
          recipientName: `User ${recipientId.substring(0, 6)}`,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: !msg.read && msg.senderId !== user?.id ? 1 : 0,
        });
      } else if (!msg.read && msg.senderId !== user?.id) {
        existing.unreadCount++;
      }
    });
    
    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  };

  const fetchMessages = async (userId: string) => {
    try {
      const data = await api.getConversation(userId);
      setMessages(data);
      const conv = conversations.find(c => c.recipientId === userId);
      setSelectedUserName(conv?.recipientName || `User ${userId.substring(0, 6)}`);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user) return;

    setSendingMessage(true);
    try {
      if (isConnected) {
        wsSendMessage(selectedUserId, newMessage.trim());
      } else {
        await api.sendMessage({
          recipientId: selectedUserId,
          content: newMessage.trim(),
        });
        fetchMessages(selectedUserId);
      }
      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Skeleton className="h-[600px] w-full max-w-4xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <MessageCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in to view messages</h1>
          <p className="text-slate-600 mb-6">Please log in to access your conversations.</p>
          <Link href="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <Card className={`w-80 flex-shrink-0 ${selectedUserId ? 'hidden md:flex' : 'flex'} flex-col`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Messages</span>
                {isConnected && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <Circle className="w-2 h-2 mr-1 fill-green-500" /> Live
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {[1,2,3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedUserId(conv.recipientId)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                          selectedUserId === conv.recipientId ? 'bg-primary/5 border-l-2 border-primary' : ''
                        }`}
                        data-testid={`conversation-${conv.recipientId}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {conv.recipientName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">{conv.recipientName}</span>
                              <span className="text-xs text-slate-400">{formatDate(conv.lastMessageTime)}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
            {selectedUserId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden"
                    onClick={() => setSelectedUserId(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUserName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedUserName}</div>
                    {typingUsers.has(selectedUserId) && (
                      <div className="text-xs text-slate-500 animate-pulse">typing...</div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            msg.senderId === user.id
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-white border text-slate-800 rounded-bl-none"
                          }`}
                        >
                          {msg.content}
                          <div className={`text-[10px] mt-1 text-right ${
                            msg.senderId === user.id ? "text-primary-foreground/70" : "text-slate-400"
                          }`}>
                            {formatTime(msg.createdAt)}
                            {msg.senderId === user.id && msg.read && " ✓✓"}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    data-testid="input-message"
                    disabled={sendingMessage}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={sendingMessage || !newMessage.trim()}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
