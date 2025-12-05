import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupportWidget } from "@/components/chat/support-widget";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { WebSocketProvider } from "@/lib/websocket";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PostJob from "@/pages/post-job";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import About from "@/pages/about";
import Messages from "@/pages/messages";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/messages/:userId" component={Messages} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      
      <Route path="/about" component={About} />
      <Route path="/privacy" component={About} />
      <Route path="/terms" component={About} />
      <Route path="/find-artisan" component={() => <Home />} /> 
      <Route path="/find-work" component={() => <Home />} /> 
      <Route path="/logistics" component={() => <Home />} /> 
      <Route path="/login" component={Dashboard} /> 
      <Route path="/register" component={PostJob} /> 
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <WebSocketProvider userId={user?.id || null}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <SupportWidget />
        <PWAInstallPrompt />
      </TooltipProvider>
    </WebSocketProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
