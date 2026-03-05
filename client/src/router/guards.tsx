// src/router/guards.tsx
import { Switch, Route } from "wouter";
import AppLayout from "@/components/focuswin/app/layout/app-layout";

import DashboardHome from "@/pages/dashboard/DashboardHome";
import SaleListPage from "@/pages/sale/SaleListPage";
import SaleDetailPage from "@/pages/sale/SaleDetailPage";
import SaleRegistPage from "@/pages/sale/SaleRegistPage";
import ScheduleListPage from "@/pages/schedule/ScheduleListPage";
import OrderListPage from "@/pages/order/OrderListPage";
import ShipmentList from "@/pages/shipment/ShipmentList";
import ClientListPage from "@/pages/client/ClientListPage";
import ClientDetailPage from "@/pages/client/ClientDetailPage";
import ClientRegistPage from "@/pages/client/ClientRegistPage";
import SettingsHub from "@/pages/settings/SettingsHub";
import SettingsTeam from "@/pages/settings/SettingsTeam";
import SettingsUsage from "@/pages/settings/SettingsUsage";
import SettingsBilling from "@/pages/settings/SettingsBilling";
import InviteEnterPage from "@/pages/invite/InviteEnterPage";
import ErrorPage from "@/pages/public/ErrorPage";
import UIKitPage from "@/pages/ui-kit/UIKitPage";

const DEV = import.meta.env.DEV;

export function AppGuard() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardHome} />
        <Route path="/sale-list" component={SaleListPage} />
        <Route path="/sale-list/regi" component={SaleRegistPage} />
        <Route path="/sale-list/:id" component={SaleDetailPage} />
        <Route path="/sche-list" component={ScheduleListPage} />
        <Route path="/orde-list" component={OrderListPage} />
        <Route path="/ship-list" component={ShipmentList} />
        <Route path="/clie-list" component={ClientListPage} />
        <Route path="/clie-list/regi" component={ClientRegistPage} />
        <Route path="/clie-list/:id" component={ClientDetailPage} />

        <Route path="/settings" component={SettingsHub} />
        <Route path="/settings/team" component={SettingsTeam} />
        <Route path="/settings/members" component={SettingsTeam} />
        <Route path="/settings/usage" component={SettingsUsage} />
        <Route path="/settings/billing" component={SettingsBilling} />

        <Route path="/invite/enter" component={InviteEnterPage} />
        <Route path="/404" component={ErrorPage} />

        {DEV ? <Route path="/__dev/ui-kit" component={UIKitPage} /> : null}

        <Route component={ErrorPage} />
      </Switch>
    </AppLayout>
  );
}