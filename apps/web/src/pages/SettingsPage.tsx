import { useCallback, useEffect, useState } from "react";

import { AppLayout } from "../components/layout/AppLayout.js";
import { SettingsPanel } from "../components/settings/SettingsPanel.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { LoadingState } from "../components/ui/LoadingState.js";
import { fetchSettingsPageData } from "../services/settings-page-service.js";
import type { AppSettings } from "../types/api.js";

export const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchSettingsPageData();
      setSettings(result.data);
      setIsMock(result.isMock);
    } catch (loadError) {
      setSettings(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar configurações.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  return (
    <AppLayout
      title="Configurações"
      subtitle="Preferências locais de monitoramento e notificações."
      isMock={isMock}
    >
      {loading && !settings ? (
        <LoadingState message="Carregando configurações" />
      ) : null}

      {error ? <ErrorState message={error} onRetry={loadSettings} /> : null}

      {settings ? (
        <SettingsPanel settings={settings} onChange={setSettings} />
      ) : null}
    </AppLayout>
  );
};
