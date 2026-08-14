import { Route, Routes } from "react-router-dom";

import { DashboardPage } from "./pages/DashboardPage.js";
import { MonitorDetailsPage } from "./pages/MonitorDetailsPage.js";

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/monitors/:id" element={<MonitorDetailsPage />} />
    </Routes>
  );
};
