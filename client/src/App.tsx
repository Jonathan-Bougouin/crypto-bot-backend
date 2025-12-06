import { Toaster } from "@/components/ui/sonner";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Performance from "./pages/Performance";
import Dashboard from "./pages/Dashboard";
import BotConfig from "./pages/BotConfig";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import Legal from "./pages/Legal";
import Terms from "./pages/Terms";
import { FloatingChat } from "@/components/FloatingChat";
import { RiskDisclaimer } from "@/components/RiskDisclaimer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/performance" component={Performance} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/bot-config" component={BotConfig} />
      <Route path="/blog" component={BlogList} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/legal" component={Legal} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <HelmetProvider>
          <TooltipProvider>
            <div className="flex flex-col min-h-screen">
              <Toaster />
              <div className="flex-grow">
                <Router />
              </div>
              <RiskDisclaimer />
              <FloatingChat />
            </div>
          </TooltipProvider>
        </HelmetProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
