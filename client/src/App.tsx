import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import DashHome from "./pages/dash/DashHome";
import SaleList from "./pages/sale/SaleList";
import SaleDeta from "./pages/sale/SaleDeta";
import SaleRegi from "./pages/sale/SaleRegi";
import ScheList from "./pages/schedule/ScheList";
import OrderList from "./pages/order/OrderList";
import ShipList from "./pages/shipment/ShipList";
import ClientList from "./pages/client/ClientList";
import ClientDeta from "./pages/client/ClientDeta";
import LandPage from "./pages/public/LandPage";
import ErroPage from "@/pages/public/ErroPage";
import DevsShow from "./pages/devs/DevsShow";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
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
        <Route path="/orde-list" component={OrderList} />
        <Route path="/ship-list" component={ShipList} />
        <Route path="/clie-list" component={ClientList} />
        <Route path="/clie-list/:id" component={ClientDeta} />
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
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/auth/login" component={LoginPage} />
        <Route path="/auth/register" component={RegisterPage} />
        <Route component={LandPage} />
      </Switch>
    );
  }
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
