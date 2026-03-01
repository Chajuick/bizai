// src/router/app.tsx
import { Switch, Route } from "wouter";
import InviteAcceptPage from "@/pages/invite/InviteAcceptPage";
import InviteEnterPage from "@/pages/invite/InviteEnterPage";
import { AppGuard } from "./guards";

export function AppRoutes() {
  return (
    <Switch>
      {/* 로그인 상태에서도 접근 가능한 초대 페이지 */}
      <Route path="/invite/enter" component={InviteEnterPage} />
      <Route path="/invite/:token" component={InviteAcceptPage} />

      {/* 나머지 전체 앱 */}
      <Route component={AppGuard} />
    </Switch>
  );
}