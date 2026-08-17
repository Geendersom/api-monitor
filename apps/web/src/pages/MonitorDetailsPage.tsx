import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout.js";
import { PageHeader } from "../components/layout/PageHeader.js";
import { MonitorAlertsPanel } from "../components/monitors/MonitorAlertsPanel.js";
import { CheckHistoryPanel } from "../components/monitors/CheckHistoryPanel.js";
import { MonitorHeader } from "../components/monitors/MonitorHeader.js";
import { MonitorOverview } from "../components/monitors/MonitorOverview.js";
import { SlaPanel } from "../components/monitors/SlaPanel.js";
import { UptimePanel } from "../components/monitors/UptimePanel.js";
import { MonitorIncidentsPanel } from "../components/incidents/MonitorIncidentsPanel.js";
import { MaintenancePanel } from "../components/maintenance/MaintenancePanel.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { LoadingState } from "../components/ui/LoadingState.js";
import { MonitorNotFoundState } from "../components/ui/MonitorNotFoundState.js";
import { USE_MOCK_DATA } from "../config/env.js";
import { ApiError, fetchMonitorDetails } from "../services/monitor-service.js";
import type { MonitorDetailsData, UptimePeriod } from "../types/api.js";

type MonitorDetailsViewState = "loading" | "success" | "error" | "not-found";

export const MonitorDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MonitorDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] =
    useState<MonitorDetailsViewState>("loading");
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [uptimePeriod, setUptimePeriod] = useState<UptimePeriod>("24h");
  const [slaPeriod, setSlaPeriod] = useState<UptimePeriod>("24h");

  const loadMonitorDetails = useCallback(async () => {
    if (!id) {
      setViewState("not-found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const details = await fetchMonitorDetails(id, uptimePeriod, slaPeriod);
      setData(details);
      setLastUpdatedAt(new Date().toISOString());
      setViewState("success");
    } catch (loadError) {
      setData(null);

      if (loadError instanceof ApiError && loadError.status === 404) {
        setViewState("not-found");
        setError(null);
      } else {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Erro inesperado ao carregar o monitor.";
        setError(message);
        setViewState("error");
      }
    } finally {
      setLoading(false);
    }
  }, [id, uptimePeriod, slaPeriod]);

  useEffect(() => {
    void loadMonitorDetails();
  }, [loadMonitorDetails]);

  return (
    <AppLayout
      operational={data?.status !== "down"}
      isMock={USE_MOCK_DATA || import.meta.env.DEV}
      headerContent={({ onMenuToggle }) =>
        viewState === "success" && data ? (
          <MonitorHeader
            monitor={data.monitor}
            status={data.status}
            lastUpdatedAt={lastUpdatedAt}
            refreshing={loading}
            onRefresh={loadMonitorDetails}
            onMenuToggle={onMenuToggle}
            inMaintenance={data.activeMaintenance.active}
          />
        ) : (
          <PageHeader
            title="Monitor"
            subtitle="Detalhes do serviço."
            onMenuToggle={onMenuToggle}
          />
        )
      }
    >
      {viewState === "loading" ? (
        <LoadingState message="Carregando monitor" />
      ) : null}

      {viewState === "not-found" ? <MonitorNotFoundState /> : null}

      {viewState === "error" ? (
        <ErrorState
          message={
            error?.includes("conectar") ||
            error?.toLowerCase().includes("unavailable")
              ? "Não foi possível conectar ao backend."
              : (error ?? "Erro desconhecido.")
          }
          onRetry={loadMonitorDetails}
        />
      ) : null}

      {viewState === "success" && data ? (
        <div className="monitor-details-content">
          <MonitorOverview data={data} />
          <div className="monitor-details-grid">
            <UptimePanel
              uptime={data.uptime}
              period={uptimePeriod}
              onPeriodChange={setUptimePeriod}
            />
            <SlaPanel
              sla={data.sla}
              period={slaPeriod}
              onPeriodChange={setSlaPeriod}
            />
          </div>
          <CheckHistoryPanel checks={data.checks} />
          <div className="monitor-details-grid">
            <MonitorIncidentsPanel incidents={data.incidents} />
            <MaintenancePanel
              maintenance={data.maintenance}
              activeMaintenance={data.activeMaintenance}
            />
          </div>
          <MonitorAlertsPanel alerts={data.alerts} />
        </div>
      ) : null}
    </AppLayout>
  );
};
