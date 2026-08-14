import { USE_MOCK_DATA } from "../config/env.js";
import { getMockSettingsAsync } from "../mocks/index.js";
import type { AppSettings, FetchResult } from "../types/api.js";

/** Página visual — configurações ainda não persistem no backend. */
export const fetchSettingsPageData = async (): Promise<
  FetchResult<AppSettings>
> => ({
  data: await getMockSettingsAsync(),
  isMock: USE_MOCK_DATA || import.meta.env.DEV,
});
