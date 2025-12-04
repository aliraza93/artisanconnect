import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupportWidget } from "@/components/chat/support-widget";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PostJob from "@/pages/post-job";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      
      <Route path="/find-artisan" component={() => <Home />} /> 
      <Route path="/find-work" component={() => <Home />} /> 
      <Route path="/logistics" component={() => <Home />} /> 
      <Route path="/login" component={Dashboard} /> 
      <Route path="/register" component={PostJob} /> 
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        {/* Global Support Widget - Visible on all client pages, hidden on admin for now (or could be handled by logic) */}
        <SupportWidget />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
