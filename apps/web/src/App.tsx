import { Route, Routes } from "react-router-dom";

import { AlertsPage } from "./pages/AlertsPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { IncidentsPage } from "./pages/IncidentsPage.js";
import { MonitorDetailsPage } from "./pages/MonitorDetailsPage.js";
import { MonitorsPage } from "./pages/MonitorsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/monitors" element={<MonitorsPage />} />
      <Route path="/monitors/:id" element={<MonitorDetailsPage />} />
      <Route path="/incidents" element={<IncidentsPage />} />
      <Route path="/alerts" element={<AlertsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
};
