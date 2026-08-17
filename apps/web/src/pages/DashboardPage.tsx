import { useCallback, useEffect, useMemo, useState } from "react";

import { DashboardSummaryCards } from "../components/dashboard/DashboardSummaryCards.js";
import { DashboardToolbar } from "../components/dashboard/DashboardToolbar.js";
import { AppLayout } from "../components/layout/AppLayout.js";
import { DashboardMonitorsTable } from "../components/monitors/DashboardMonitorsTable.js";
import { MonitorFormModal } from "../components/monitors/MonitorFormModal.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { LoadingState } from "../components/ui/LoadingState.js";
import { buildOverviewFromMonitors } from "../services/dashboard-overview.js";
import { fetchDashboardData } from "../services/dashboard-service.js";
import {
  applyMonitorUpdate,
  createMonitorOnApi,
  createMonitorWithStatus,
  toggleMonitorPaused,
  validateMonitorForm,
} from "../services/monitor-management.js";
import type {
  CreateMonitorInput,
  DashboardData,
  MonitorWithStatus,
} from "../types/api.js";

type DashboardViewState = "loading" | "success" | "error" | "empty";

type MonitorFormState =
  | { mode: "create" }
  | { mode: "edit"; monitor: MonitorWithStatus };

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

const syncOverview = (
  data: DashboardData,
  monitors: MonitorWithStatus[],
): DashboardData => ({
  monitors,
  overview: buildOverviewFromMonitors(
    monitors,
    data.overview.recentAlerts,
    data.overview,
  ),
});

export const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formState, setFormState] = useState<MonitorFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchDashboardData();
      setData(result.data);
      setIsMock(result.isMock);
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

  const closeFormModal = useCallback(() => {
    setFormState(null);
    setFormError(null);
    setFormSubmitting(false);
  }, []);

  const openCreateModal = useCallback(() => {
    setFormError(null);
    setFormState({ mode: "create" });
  }, []);

  const openEditModal = useCallback((monitor: MonitorWithStatus) => {
    setFormError(null);
    setFormState({ mode: "edit", monitor });
  }, []);

  const handleSaveMonitor = useCallback(
    async (input: CreateMonitorInput) => {
      const validationError = validateMonitorForm(input);
      if (validationError) {
        setFormError(validationError);
        return;
      }

      if (!formState || !data) {
        return;
      }

      setFormError(null);
      setFormSubmitting(true);

      try {
        if (formState.mode === "create") {
          if (isMock) {
            const newMonitor = createMonitorWithStatus(input);
            setData((current) =>
              current ? syncOverview(current, [...current.monitors, newMonitor]) : current,
            );
          } else {
            const created = await createMonitorOnApi(input);
            const newMonitor = createMonitorWithStatus(input, created.id);
            setData((current) =>
              current ? syncOverview(current, [...current.monitors, newMonitor]) : current,
            );
          }
        } else {
          setData((current) => {
            if (!current) {
              return current;
            }

            const monitors = current.monitors.map((monitor) =>
              monitor.id === formState.monitor.id
                ? applyMonitorUpdate(monitor, input)
                : monitor,
            );

            return syncOverview(current, monitors);
          });
        }

        closeFormModal();
      } catch (saveError) {
        const message =
          saveError instanceof Error
            ? saveError.message
            : "Não foi possível salvar a API.";
        setFormError(message);
      } finally {
        setFormSubmitting(false);
      }
    },
    [closeFormModal, data, formState, isMock],
  );

  const handleDeleteMonitor = useCallback((monitorId: string) => {
    setData((current) => {
      if (!current) {
        return current;
      }

      const monitors = current.monitors.filter(
        (monitor) => monitor.id !== monitorId,
      );

      return syncOverview(current, monitors);
    });
  }, []);

  const handleTogglePause = useCallback((monitorId: string) => {
    setData((current) => {
      if (!current) {
        return current;
      }

      const monitors = current.monitors.map((monitor) =>
        monitor.id === monitorId ? toggleMonitorPaused(monitor) : monitor,
      );

      return syncOverview(current, monitors);
    });
  }, []);

  const viewState = resolveViewState(data, error, loading);

  const toolbar = useMemo(
    () => (
      <DashboardToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onAddMonitor={openCreateModal}
      />
    ),
    [openCreateModal, searchQuery],
  );

  const formInitialValues =
    formState?.mode === "edit"
      ? { name: formState.monitor.name, url: formState.monitor.url }
      : undefined;

  return (
    <AppLayout
      title="Visão Geral"
      subtitle="Resumo do status das suas APIs monitoradas."
      headerActions={toolbar}
      {...(data?.overview.totalAlerts !== undefined
        ? { alertCount: data.overview.totalAlerts }
        : {})}
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
        <div className="page-content page-content--dashboard">
          <DashboardSummaryCards overview={data.overview} />
          <DashboardMonitorsTable
            monitors={data.monitors}
            searchQuery={searchQuery}
            onEditMonitor={openEditModal}
            onDeleteMonitor={handleDeleteMonitor}
            onTogglePauseMonitor={handleTogglePause}
          />
        </div>
      ) : null}

      <MonitorFormModal
        open={formState !== null}
        mode={formState?.mode ?? "create"}
        {...(formInitialValues ? { initialValues: formInitialValues } : {})}
        error={formError}
        submitting={formSubmitting}
        onClose={closeFormModal}
        onSubmit={handleSaveMonitor}
      />
    </AppLayout>
  );
};
