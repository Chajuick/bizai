// src/router/auth.tsx
import { Switch, Route, Redirect, useLocation } from "wouter";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import InviteAcceptPage from "@/pages/invite/InviteAcceptPage";
import InviteEnterPage from "@/pages/invite/InviteEnterPage";
import LandingPage from "@/pages/public/LandingPage";

import { preserveAuthRedirect } from "./redirect";

function UnauthedDefaultRoute() {
  const [loc] = useLocation();

  if (loc === "/") return <LandingPage />;

  // 안전장치
  if (loc.startsWith("/auth/")) return <Redirect to="/auth/login" />;
  if (loc.startsWith("/invite/")) return <Redirect to={loc} />;

  // wouter location을 그대로 저장 (query 포함)
  preserveAuthRedirect(loc);

  return <Redirect to="/auth/login" />;
}

export function AuthRoutes() {
  return (
    <Switch>
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />

      <Route path="/invite/enter" component={InviteEnterPage} />
      <Route path="/invite/:token" component={InviteAcceptPage} />

      <Route component={UnauthedDefaultRoute} />
    </Switch>
  );
}