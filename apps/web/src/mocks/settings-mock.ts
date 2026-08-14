import type { AppSettings } from "../types/api.js";

/** Dados mockados de desenvolvimento — sem persistência real. */
export const getMockSettings = (): AppSettings => ({
  monitoring: {
    checkIntervalSeconds: 60,
    timeoutSeconds: 30,
    retries: 3,
  },
  notifications: {
    email: true,
    whatsapp: false,
    telegram: true,
    push: false,
  },
  system: {
    appName: "API Monitor",
    environment: "development",
    apiUrl: "http://127.0.0.1:3000",
  },
  security: {
    apiStatus: "reachable",
    lastVerificationAt: new Date().toISOString(),
    systemState: "operational",
  },
});

export const getMockSettingsAsync = async (): Promise<AppSettings> => {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return getMockSettings();
};
