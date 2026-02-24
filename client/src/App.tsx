import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import SalesLogs from "./pages/SalesLogs";
import SalesLogDetail from "./pages/SalesLogDetail";
import SalesLogNew from "./pages/SalesLogNew";
import Promises from "./pages/Promises";
import Orders from "./pages/Orders";
import Deliveries from "./pages/Deliveries";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import LandingPage from "./pages/LandingPage";
import { useAuth } from "./_core/hooks/useAuth";

function AuthenticatedApp() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/sales-logs" component={SalesLogs} />
        <Route path="/sales-logs/new" component={SalesLogNew} />
        <Route path="/sales-logs/:id" component={SalesLogDetail} />
        <Route path="/promises" component={Promises} />
        <Route path="/orders" component={Orders} />
        <Route path="/deliveries" component={Deliveries} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--blueprint-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-sm font-mono text-blue-400/60 tracking-widest">LOADING...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <LandingPage />;
  return <AuthenticatedApp />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster
            theme="light"
            toastOptions={{
              style: {
                background: 'var(--blueprint-surface)',
                border: '1px solid var(--blueprint-border)',
                color: 'var(--blueprint-text)',
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
