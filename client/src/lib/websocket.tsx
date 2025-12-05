import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import type { Message } from "./api";

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (recipientId: string, content: string, jobId?: string) => void;
  sendTyping: (recipientId: string, isTyping: boolean) => void;
  markAsRead: (messageId: string, conversationUserId: string) => void;
  messages: Message[];
  typingUsers: Set<string>;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  userId: string | null;
  onNewMessage?: (message: Message) => void;
  onNotification?: (notification: any) => void;
}

export function WebSocketProvider({ children, userId, onNewMessage, onNotification }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!userId || wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      wsRef.current = null;

      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [userId]);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case "connected":
        console.log("WebSocket authenticated as user:", data.userId);
        break;

      case "new_message":
        setMessages(prev => [...prev, data.message]);
        onNewMessage?.(data.message);
        break;

      case "typing":
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (data.isTyping) {
            next.add(data.senderId);
          } else {
            next.delete(data.senderId);
          }
          return next;
        });
        break;

      case "message_read":
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId ? { ...msg, read: true } : msg
          )
        );
        break;

      case "notification":
        onNotification?.(data);
        break;

      case "error":
        console.error("WebSocket error:", data.error);
        break;
    }
  }, [onNewMessage, onNotification]);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, connect]);

  const sendMessage = useCallback((recipientId: string, content: string, jobId?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "send_message",
        recipientId,
        content,
        jobId,
      }));
    }
  }, []);

  const sendTyping = useCallback((recipientId: string, isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        recipientId,
        isTyping,
      }));
    }
  }, []);

  const markAsRead = useCallback((messageId: string, conversationUserId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "mark_read",
        messageId,
        conversationUserId,
      }));
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      sendMessage,
      sendTyping,
      markAsRead,
      messages,
      typingUsers,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
