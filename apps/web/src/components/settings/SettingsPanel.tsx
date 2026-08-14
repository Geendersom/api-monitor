import type { AppSettings } from "../../types/api.js";
import { formatDateTime } from "../../services/formatters.js";

type SettingsPanelProps = {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
};

export const SettingsPanel = ({ settings, onChange }: SettingsPanelProps) => {
  const updateMonitoring = (
    field: keyof AppSettings["monitoring"],
    value: number,
  ) => {
    onChange({
      ...settings,
      monitoring: { ...settings.monitoring, [field]: value },
    });
  };

  const updateNotification = (
    field: keyof AppSettings["notifications"],
    value: boolean,
  ) => {
    onChange({
      ...settings,
      notifications: { ...settings.notifications, [field]: value },
    });
  };

  const updateSystem = (field: keyof AppSettings["system"], value: string) => {
    onChange({
      ...settings,
      system: { ...settings.system, [field]: value },
    });
  };

  return (
    <div className="settings-page">
      <section className="panel settings-section">
        <h2 className="panel__title">Monitoramento</h2>
        <div className="settings-grid">
          <label className="field">
            <span className="field__label">Intervalo de verificação (s)</span>
            <input
              className="field__input"
              type="number"
              value={settings.monitoring.checkIntervalSeconds}
              onChange={(event) =>
                updateMonitoring(
                  "checkIntervalSeconds",
                  Number(event.target.value),
                )
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Timeout (s)</span>
            <input
              className="field__input"
              type="number"
              value={settings.monitoring.timeoutSeconds}
              onChange={(event) =>
                updateMonitoring("timeoutSeconds", Number(event.target.value))
              }
            />
          </label>
          <label className="field">
            <span className="field__label">Retentativas</span>
            <input
              className="field__input"
              type="number"
              value={settings.monitoring.retries}
              onChange={(event) =>
                updateMonitoring("retries", Number(event.target.value))
              }
            />
          </label>
        </div>
      </section>

      <section className="panel settings-section">
        <h2 className="panel__title">Notificações</h2>
        <div className="settings-toggles">
          {(
            [
              ["email", "E-mail"],
              ["whatsapp", "WhatsApp"],
              ["telegram", "Telegram"],
              ["push", "Push"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="toggle-field">
              <span className="toggle-field__label">{label}</span>
              <input
                className="toggle-field__input"
                type="checkbox"
                checked={settings.notifications[key]}
                onChange={(event) =>
                  updateNotification(key, event.target.checked)
                }
              />
              <span className="toggle-field__switch" aria-hidden="true" />
            </label>
          ))}
        </div>
      </section>

      <section className="panel settings-section">
        <h2 className="panel__title">Sistema</h2>
        <div className="settings-grid">
          <label className="field">
            <span className="field__label">Nome da aplicação</span>
            <input
              className="field__input"
              type="text"
              value={settings.system.appName}
              onChange={(event) => updateSystem("appName", event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Ambiente</span>
            <input
              className="field__input"
              type="text"
              value={settings.system.environment}
              onChange={(event) =>
                updateSystem("environment", event.target.value)
              }
            />
          </label>
          <label className="field field--wide">
            <span className="field__label">URL da API</span>
            <input
              className="field__input"
              type="url"
              value={settings.system.apiUrl}
              onChange={(event) => updateSystem("apiUrl", event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="panel settings-section">
        <h2 className="panel__title">Segurança</h2>
        <div className="settings-readonly">
          <div className="settings-readonly__item">
            <span className="settings-readonly__label">API status</span>
            <span className="settings-readonly__value settings-readonly__value--success">
              {settings.security.apiStatus}
            </span>
          </div>
          <div className="settings-readonly__item">
            <span className="settings-readonly__label">Última verificação</span>
            <span className="settings-readonly__value">
              {formatDateTime(settings.security.lastVerificationAt)}
            </span>
          </div>
          <div className="settings-readonly__item">
            <span className="settings-readonly__label">Estado do sistema</span>
            <span className="settings-readonly__value settings-readonly__value--success">
              {settings.security.systemState}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
