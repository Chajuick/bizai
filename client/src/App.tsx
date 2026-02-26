import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import DashHome from "./pages/Dash/DashHome";
import SaleList from "./pages/Sale/SaleList";
import SaleDeta from "./pages/Sale/SaleDeta";
import SaleRegi from "./pages/Sale/SaleRegi";
import ScheList from "./pages/Sche/ScheList";
import OrdeList from "./pages/Orde/OrdeList";
import ShipList from "./pages/Ship/SaleList";
import ClieList from "./pages/Clie/ClieList";
import ClieDeta from "./pages/Clie/ClieDeta";
import LandPage from "./pages/Publ/LandPage";
import ErroPage from "@/pages/Publ/ErroPage";
import DevsShow from "./pages/Devs/DevsShow";
import { useAuth } from "./_core/hooks/useAuth";

const DEV = import.meta.env.DEV;

function AuthenticatedApp() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashHome} />
        <Route path="/sale-list" component={SaleList} />
        <Route path="/sale-list/regi" component={SaleRegi} />
        <Route path="/sale-list/:id" component={SaleDeta} />
        <Route path="/sche-list" component={ScheList} />
        <Route path="/orde-list" component={OrdeList} />
        <Route path="/ship-list" component={ShipList} />
        <Route path="/clie-list" component={ClieList} />
        <Route path="/clie-list/:id" component={ClieDeta} />
        <Route path="/404" component={ErroPage} />
        {DEV ? <Route path="/__dev/components" component={DevsShow} /> : null}
        <Route component={ErroPage} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-500">불러오는 중…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <LandPage />;
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
                background: "var(--blueprint-surface)",
                border: "1px solid var(--blueprint-border)",
                color: "var(--blueprint-text)",
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
