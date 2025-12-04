import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, MoreVertical, Paperclip, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: number;
  sender: "me" | "other" | "admin";
  text: string;
  time: string;
}

interface ChatInterfaceProps {
  recipientName: string;
  recipientAvatar?: string;
  recipientRole?: string;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isAdminView?: boolean; // If true, shows "Monitor Mode" warnings
}

export function ChatInterface({ 
  recipientName, 
  recipientAvatar = "U", 
  recipientRole = "Artisan",
  messages, 
  onSendMessage,
  isAdminView = false
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b flex justify-between items-center ${isAdminView ? "bg-slate-900 text-white" : "bg-white"}`}>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarFallback className={isAdminView ? "text-slate-900" : ""}>{recipientAvatar}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              {recipientName}
              {isAdminView && <Badge variant="secondary" className="text-[10px] h-5">Monitoring</Badge>}
            </div>
            <div className={`text-xs ${isAdminView ? "text-slate-400" : "text-slate-500"}`}>{recipientRole} • Online</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {!isAdminView && (
             <Button variant="ghost" size="icon" className="h-8 w-8">
               <Phone className="h-4 w-4" />
             </Button>
           )}
           <Button variant="ghost" size="icon" className="h-8 w-8">
             <MoreVertical className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {/* Admin Warning Banner */}
      {isAdminView && (
        <div className="bg-amber-50 text-amber-800 px-4 py-2 text-xs flex items-center gap-2 border-b border-amber-100">
          <ShieldAlert className="h-3 w-3" />
          <span>You are viewing a private conversation. Messages you send will appear as "Support".</span>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-slate-50/50">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : msg.sender === "admin"
                    ? "bg-slate-800 text-white rounded-xl border-2 border-yellow-500/50" 
                    : "bg-white border text-slate-800 rounded-bl-none"
                }`}
              >
                {msg.sender === "admin" && <div className="text-[10px] uppercase font-bold text-yellow-400 mb-1">Admin Support</div>}
                {msg.text}
                <div className={`text-[10px] mt-1 text-right ${
                  msg.sender === "me" ? "text-primary-foreground/70" : "text-slate-400"
                }`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2 items-center">
        <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isAdminView ? "Intervene as Support..." : "Type a message..."}
          className="flex-1 border-slate-200 focus-visible:ring-primary"
        />
        <Button type="submit" size="icon" className={isAdminView ? "bg-slate-900 hover:bg-slate-800" : "bg-primary"}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
