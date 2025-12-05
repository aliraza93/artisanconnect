import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { storage } from "./storage";
import { log } from "./index";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  isAlive: boolean;
}

const clients = new Map<string, ConnectedClient[]>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws"
  });

  const heartbeatInterval = setInterval(() => {
    clients.forEach((connections, userId) => {
      connections.forEach((client, index) => {
        if (!client.isAlive) {
          client.ws.terminate();
          connections.splice(index, 1);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
      if (connections.length === 0) {
        clients.delete(userId);
      }
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      ws.close(1008, "User ID required");
      return;
    }

    log(`WebSocket connected: user ${userId}`, "websocket");

    const client: ConnectedClient = { ws, userId, isAlive: true };
    
    if (!clients.has(userId)) {
      clients.set(userId, []);
    }
    clients.get(userId)!.push(client);

    ws.on("pong", () => {
      client.isAlive = true;
    });

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(userId, message);
      } catch (error) {
        log(`WebSocket message error: ${error}`, "websocket");
        ws.send(JSON.stringify({ type: "error", error: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      log(`WebSocket disconnected: user ${userId}`, "websocket");
      const userConnections = clients.get(userId);
      if (userConnections) {
        const index = userConnections.findIndex(c => c.ws === ws);
        if (index > -1) {
          userConnections.splice(index, 1);
        }
        if (userConnections.length === 0) {
          clients.delete(userId);
        }
      }
    });

    ws.on("error", (error) => {
      log(`WebSocket error for user ${userId}: ${error}`, "websocket");
    });

    ws.send(JSON.stringify({ type: "connected", userId }));
  });

  return wss;
}

async function handleMessage(senderId: string, message: any) {
  switch (message.type) {
    case "send_message":
      await handleSendMessage(senderId, message);
      break;
    case "typing":
      handleTypingIndicator(senderId, message);
      break;
    case "mark_read":
      await handleMarkRead(senderId, message);
      break;
    default:
      log(`Unknown message type: ${message.type}`, "websocket");
  }
}

async function handleSendMessage(senderId: string, message: any) {
  const { recipientId, content, jobId } = message;
  
  try {
    const savedMessage = await storage.createMessage({
      senderId,
      recipientId,
      content,
      jobId: jobId || null,
      read: false,
    });

    const messagePayload = {
      type: "new_message",
      message: savedMessage,
    };

    sendToUser(senderId, messagePayload);
    sendToUser(recipientId, messagePayload);

    log(`Message sent from ${senderId} to ${recipientId}`, "websocket");
  } catch (error) {
    log(`Error saving message: ${error}`, "websocket");
    sendToUser(senderId, { type: "error", error: "Failed to send message" });
  }
}

function handleTypingIndicator(senderId: string, message: any) {
  const { recipientId, isTyping } = message;
  
  sendToUser(recipientId, {
    type: "typing",
    senderId,
    isTyping,
  });
}

async function handleMarkRead(senderId: string, message: any) {
  const { messageId, conversationUserId } = message;
  
  try {
    await storage.markMessageAsRead(messageId);
    
    sendToUser(conversationUserId, {
      type: "message_read",
      messageId,
      readBy: senderId,
    });
  } catch (error) {
    log(`Error marking message as read: ${error}`, "websocket");
  }
}

function sendToUser(userId: string, payload: any) {
  const userConnections = clients.get(userId);
  if (userConnections) {
    const message = JSON.stringify(payload);
    userConnections.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }
}

export function broadcastToAll(payload: any, excludeUserId?: string) {
  const message = JSON.stringify(payload);
  clients.forEach((connections, userId) => {
    if (userId !== excludeUserId) {
      connections.forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      });
    }
  });
}

export function notifyUser(userId: string, notification: any) {
  sendToUser(userId, {
    type: "notification",
    ...notification,
  });
}
