import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PostJob from "@/pages/post-job";
import Dashboard from "@/pages/dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/find-artisan" component={() => <Home />} /> {/* Placeholder to keep flow working */}
      <Route path="/find-work" component={() => <Home />} /> {/* Placeholder */}
      <Route path="/logistics" component={() => <Home />} /> {/* Placeholder */}
      <Route path="/login" component={Dashboard} /> {/* Mock Login */}
      <Route path="/register" component={PostJob} /> {/* Mock Register */}
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
