// src/router/guards.tsx
import { Switch, Route } from "wouter";
import AppLayout from "@/components/AppLayout";

import DashboardHome from "@/pages/dashboard/DashboardHome";
import SaleListPage from "@/pages/sale/SaleListPage";
import SaleDetailPage from "@/pages/sale/SaleDetailPage";
import SaleRegist from "@/pages/sale/SaleRegist";
import ScheduleList from "@/pages/schedule/ScheduleList";
import OrderList from "@/pages/order/OrderList";
import ShipmentList from "@/pages/shipment/ShipmentList";
import ClientList from "@/pages/client/ClientList";
import ClientDetail from "@/pages/client/ClientDetail";
import SettingsHub from "@/pages/settings/SettingsHub";
import SettingsTeam from "@/pages/settings/SettingsTeam";
import SettingsUsage from "@/pages/settings/SettingsUsage";
import SettingsBilling from "@/pages/settings/SettingsBilling";
import InviteEnterPage from "@/pages/invite/InviteEnterPage";
import ErrorPage from "@/pages/public/ErrorPage";
import DevsShow from "@/pages/devs/DevsShow";

const DEV = import.meta.env.DEV;

export function AppGuard() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardHome} />
        <Route path="/sale-list" component={SaleListPage} />
        <Route path="/sale-list/regi" component={SaleRegist} />
        <Route path="/sale-list/:id" component={SaleDetailPage} />
        <Route path="/sche-list" component={ScheduleList} />
        <Route path="/orde-list" component={OrderList} />
        <Route path="/ship-list" component={ShipmentList} />
        <Route path="/clie-list" component={ClientList} />
        <Route path="/clie-list/:id" component={ClientDetail} />

        <Route path="/settings" component={SettingsHub} />
        <Route path="/settings/team" component={SettingsTeam} />
        <Route path="/settings/members" component={SettingsTeam} />
        <Route path="/settings/usage" component={SettingsUsage} />
        <Route path="/settings/billing" component={SettingsBilling} />

        <Route path="/invite/enter" component={InviteEnterPage} />
        <Route path="/404" component={ErrorPage} />

        {DEV ? <Route path="/__dev/components" component={DevsShow} /> : null}

        <Route component={ErrorPage} />
      </Switch>
    </AppLayout>
  );
}