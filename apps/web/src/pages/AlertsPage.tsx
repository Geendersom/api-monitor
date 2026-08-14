import { useCallback, useEffect, useState } from "react";

import { RecentAlertsList } from "../components/alerts/RecentAlertsList.js";
import { AppLayout } from "../components/layout/AppLayout.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { LoadingState } from "../components/ui/LoadingState.js";
import { fetchAlertsPageData } from "../services/alerts-page-service.js";
import type { AlertsPageData } from "../types/api.js";

export const AlertsPage = () => {
  const [data, setData] = useState<AlertsPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAlertsPageData();
      setData(result.data);
      setIsMock(result.isMock);
      setLastUpdatedAt(new Date().toISOString());
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar alertas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  return (
    <AppLayout
      title="Alertas"
      subtitle="Linha do tempo de eventos e notificações."
      lastUpdatedAt={lastUpdatedAt}
      onRefresh={loadAlerts}
      refreshing={loading}
      isMock={isMock}
    >
      {loading && !data ? <LoadingState message="Carregando alertas" /> : null}

      {error ? <ErrorState message={error} onRetry={loadAlerts} /> : null}

      {data ? (
        <RecentAlertsList
          alerts={data.alerts}
          monitorNames={data.monitorNames}
        />
      ) : null}
    </AppLayout>
  );
};
