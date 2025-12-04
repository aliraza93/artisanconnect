import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChatInterface } from "./chat-interface";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: "other", text: "Hi there! How can we help you today?", time: "Now" }
  ]);

  // @ts-ignore
  const handleSendMessage = (text: string) => {
    const newMsg = { id: Date.now(), sender: "me", text, time: "Now" };
    // @ts-ignore
    setMessages([...messages, newMsg]);
    
    // Simulate response
    setTimeout(() => {
      // @ts-ignore
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: "other", 
        text: "Thanks for reaching out. An agent will be with you shortly.", 
        time: "Now" 
      }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-[350px] h-[500px] shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <ChatInterface 
            recipientName="ArtisanConnect Support"
            recipientRole="Customer Care"
            recipientAvatar="S"
            // @ts-ignore
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>
      )}

      <Button 
        onClick={() => setIsOpen(!isOpen)}
        size="lg" 
        className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-white p-0"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
