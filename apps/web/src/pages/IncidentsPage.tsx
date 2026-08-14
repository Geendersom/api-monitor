import { useCallback, useEffect, useState } from "react";

import { IncidentsPageList } from "../components/incidents/IncidentsPageList.js";
import { AppLayout } from "../components/layout/AppLayout.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { LoadingState } from "../components/ui/LoadingState.js";
import { fetchIncidentsPageData } from "../services/incidents-page-service.js";
import type { IncidentsPageData } from "../types/api.js";

export const IncidentsPage = () => {
  const [data, setData] = useState<IncidentsPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchIncidentsPageData();
      setData(result.data);
      setIsMock(result.isMock);
      setLastUpdatedAt(new Date().toISOString());
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar incidentes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const hasActive = (data?.active.length ?? 0) > 0;

  return (
    <AppLayout
      title="Incidentes"
      subtitle="Eventos ativos e histórico de recuperação."
      lastUpdatedAt={lastUpdatedAt}
      onRefresh={loadIncidents}
      refreshing={loading}
      operational={!hasActive}
      isMock={isMock}
    >
      {loading && !data ? (
        <LoadingState message="Carregando incidentes" />
      ) : null}

      {error ? <ErrorState message={error} onRetry={loadIncidents} /> : null}

      {data ? (
        <IncidentsPageList active={data.active} resolved={data.resolved} />
      ) : null}
    </AppLayout>
  );
};
