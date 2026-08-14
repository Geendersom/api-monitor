import { useCallback, useEffect, useMemo, useState } from "react";

import { SystemStatusBanner } from "../components/dashboard/SystemStatusBanner.js";
import { AppLayout } from "../components/layout/AppLayout.js";
import { RecentAlertsList } from "../components/alerts/RecentAlertsList.js";
import { ActiveIncidentsPanel } from "../components/incidents/ActiveIncidentsPanel.js";
import { MetricsGrid } from "../components/metrics/MetricsGrid.js";
import { MonitorsTable } from "../components/monitors/MonitorsTable.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { LoadingState } from "../components/ui/LoadingState.js";
import { fetchDashboardData } from "../services/dashboard-service.js";
import type { DashboardData } from "../types/api.js";

type DashboardViewState = "loading" | "success" | "error" | "empty";

const resolveViewState = (
  data: DashboardData | null,
  error: string | null,
  loading: boolean,
): DashboardViewState => {
  if (loading) {
    return "loading";
  }

  if (error) {
    return "error";
  }

  if (!data) {
    return "error";
  }

  const hasContent =
    data.overview.totalMonitors > 0 ||
    data.overview.totalAlerts > 0 ||
    data.overview.recentAlerts.length > 0;

  if (!hasContent) {
    return "empty";
  }

  return "success";
};

export const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchDashboardData();
      setData(result.data);
      setIsMock(result.isMock);
      setLastUpdatedAt(new Date().toISOString());
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Erro inesperado ao carregar a dashboard.";
      setData(null);
      setError(message);
      setIsMock(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const viewState = resolveViewState(data, error, loading);

  const monitorNames = useMemo(() => {
    if (!data) {
      return {};
    }

    return Object.fromEntries(
      data.monitors.map((monitor) => [monitor.id, monitor.name]),
    );
  }, [data]);

  const downMonitors = data?.overview.downMonitors ?? 0;

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Visão geral da saúde dos seus monitores."
      lastUpdatedAt={lastUpdatedAt}
      downMonitors={downMonitors}
      onRefresh={loadDashboard}
      refreshing={loading}
      operational={downMonitors === 0}
      isMock={isMock}
    >
      {viewState === "loading" ? <LoadingState /> : null}

      {viewState === "error" ? (
        <ErrorState
          message={
            error?.includes("conectar") || error?.includes("connect")
              ? "Não foi possível conectar ao backend."
              : (error ?? "Erro desconhecido.")
          }
          onRetry={loadDashboard}
        />
      ) : null}

      {viewState === "empty" ? <EmptyState onRetry={loadDashboard} /> : null}

      {viewState === "success" && data ? (
        <div className="dashboard-content">
          <SystemStatusBanner downMonitors={data.overview.downMonitors} />
          <MetricsGrid overview={data.overview} />
          <MonitorsTable monitors={data.monitors} />
          <div className="dashboard-split">
            <ActiveIncidentsPanel monitors={data.monitors} />
            <RecentAlertsList
              alerts={data.overview.recentAlerts}
              monitorNames={monitorNames}
            />
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
};
