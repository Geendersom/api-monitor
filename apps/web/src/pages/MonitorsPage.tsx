import { useCallback, useEffect, useState } from "react";

import { AppLayout } from "../components/layout/AppLayout.js";
import { MonitorsSummary } from "../components/monitors/MonitorsSummary.js";
import { MonitorsTable } from "../components/monitors/MonitorsTable.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { LoadingState } from "../components/ui/LoadingState.js";
import { fetchMonitorsPageData } from "../services/monitors-page-service.js";
import type { MonitorsPageData } from "../types/api.js";

export const MonitorsPage = () => {
  const [data, setData] = useState<MonitorsPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadMonitors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchMonitorsPageData();
      setData(result.data);
      setIsMock(result.isMock);
      setLastUpdatedAt(new Date().toISOString());
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar monitores.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMonitors();
  }, [loadMonitors]);

  const downMonitors = data?.summary.down ?? 0;

  return (
    <AppLayout
      title="Monitores"
      subtitle="Todos os serviços monitorados."
      lastUpdatedAt={lastUpdatedAt}
      onRefresh={loadMonitors}
      refreshing={loading}
      operational={downMonitors === 0}
      isMock={isMock}
    >
      {loading && !data ? (
        <LoadingState message="Carregando monitores" />
      ) : null}

      {error ? <ErrorState message={error} onRetry={loadMonitors} /> : null}

      {data ? (
        <div className="page-content">
          <MonitorsSummary summary={data.summary} />
          <MonitorsTable monitors={data.monitors} />
        </div>
      ) : null}
    </AppLayout>
  );
};
