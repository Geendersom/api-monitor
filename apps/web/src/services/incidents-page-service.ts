import { USE_MOCK_DATA } from "../config/env.js";
import { getMockIncidentsAsync } from "../mocks/index.js";
import type { FetchResult, IncidentsPageData } from "../types/api.js";

/** Página visual — backend global de incidentes ainda não existe. */
export const fetchIncidentsPageData = async (): Promise<
  FetchResult<IncidentsPageData>
> => ({
  data: await getMockIncidentsAsync(),
  isMock: USE_MOCK_DATA || import.meta.env.DEV,
});
