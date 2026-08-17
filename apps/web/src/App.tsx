import { Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/auth/ProtectedRoute.js";
import { AlertsPage } from "./pages/AlertsPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { IncidentsPage } from "./pages/IncidentsPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { MonitorDetailsPage } from "./pages/MonitorDetailsPage.js";
import { MonitorsPage } from "./pages/MonitorsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { ThemeProvider } from "./theme/ThemeProvider.js";

export const App = () => {
  return (
    <ThemeProvider>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitors"
        element={
          <ProtectedRoute>
            <MonitorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitors/:id"
        element={
          <ProtectedRoute>
            <MonitorDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <IncidentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      </Routes>
    </ThemeProvider>
  );
};
