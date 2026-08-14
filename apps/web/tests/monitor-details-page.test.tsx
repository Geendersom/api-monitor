import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MonitorDetailsPage } from "../src/pages/MonitorDetailsPage.js";
import type { MonitorDetailsData } from "../src/types/api.js";
import { ApiError } from "../src/types/api.js";

const fetchMonitorDetailsMock = vi.fn();

vi.mock("../src/services/monitor-service.js", async () => {
  const actual = await vi.importActual<
    typeof import("../src/services/monitor-service.js")
  >("../src/services/monitor-service.js");

  return {
    ...actual,
    fetchMonitorDetails: (...args: unknown[]) =>
      fetchMonitorDetailsMock(...args),
  };
});

const buildDetails = (
  overrides: Partial<MonitorDetailsData> = {},
): MonitorDetailsData => ({
  monitor: {
    id: "monitor-1",
    name: "API Principal",
    url: "https://example.com/health",
  },
  status: "up",
  lastCheck: {
    id: "check-1",
    monitorId: "monitor-1",
    status: "up",
    responseTimeMs: 120,
    checkedAt: "2026-08-14T12:00:00.000Z",
    statusCode: 200,
  },
  uptime: {
    monitorId: "monitor-1",
    period: "24h",
    from: "2026-08-13T12:00:00.000Z",
    to: "2026-08-14T12:00:00.000Z",
    totalChecks: 1,
    successfulChecks: 1,
    failedChecks: 0,
    uptimePercentage: 100,
    averageResponseTimeMs: 120,
  },
  sla: {
    monitorId: "monitor-1",
    period: "24h",
    from: "2026-08-13T12:00:00.000Z",
    to: "2026-08-14T12:00:00.000Z",
    slaTargetPercentage: 99.9,
    uptimePercentage: 100,
    downtimeMs: 0,
    allowedDowntimeMs: 86400,
    exceededDowntimeMs: 0,
    status: "compliant",
  },
  checks: [],
  incidents: [],
  maintenance: [],
  activeMaintenance: { active: false, maintenance: null },
  alerts: [],
  ...overrides,
});

const renderPage = (initialEntry = "/monitors/monitor-1") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<div>Dashboard Home</div>} />
        <Route path="/monitors/:id" element={<MonitorDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );

const waitForMonitorHeading = async () => {
  await waitFor(() => {
    expect(
      screen.getAllByRole("heading", { level: 1, name: "API Principal" }),
    ).toHaveLength(1);
  });
};

describe("MonitorDetailsPage", () => {
  beforeEach(() => {
    fetchMonitorDetailsMock.mockReset();
  });

  it("renders loading and then monitor details", async () => {
    fetchMonitorDetailsMock.mockResolvedValue(buildDetails());

    renderPage();

    expect(screen.getByText("Carregando monitor")).toBeInTheDocument();

    expect(await screen.findByText("API Principal")).toBeInTheDocument();
    expect(screen.getByText("Resumo do monitor")).toBeInTheDocument();
    expect(screen.getByText("Histórico de checks")).toBeInTheDocument();
  });

  it("shows not found state for missing monitor", async () => {
    fetchMonitorDetailsMock.mockRejectedValue(
      new ApiError("Monitor not found", 404),
    );

    renderPage("/monitors/missing");

    expect(
      await screen.findByText("Monitor não encontrado"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voltar ao Dashboard" }),
    ).toHaveAttribute("href", "/");
  });

  it("shows API error and retries", async () => {
    fetchMonitorDetailsMock
      .mockRejectedValueOnce(new ApiError("API unavailable", 0))
      .mockResolvedValueOnce(buildDetails());

    renderPage();

    expect(
      await screen.findByText("Falha ao carregar a dashboard"),
    ).toBeInTheDocument();

    await fireEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findByText("API Principal")).toBeInTheDocument();
  });

  it("changes uptime period", async () => {
    fetchMonitorDetailsMock.mockResolvedValue(buildDetails());

    renderPage();

    await waitForMonitorHeading();

    fetchMonitorDetailsMock.mockResolvedValue(
      buildDetails({
        uptime: {
          ...buildDetails().uptime,
          period: "7d",
          totalChecks: 5,
        },
      }),
    );

    const uptimeSection = screen
      .getByRole("heading", { name: "Uptime" })
      .closest("section");
    expect(uptimeSection).not.toBeNull();
    await fireEvent.click(
      within(uptimeSection as HTMLElement).getByRole("button", { name: "7d" }),
    );

    await waitFor(() => {
      expect(fetchMonitorDetailsMock).toHaveBeenLastCalledWith(
        "monitor-1",
        "7d",
        "24h",
      );
    });
  });

  it("changes SLA period", async () => {
    fetchMonitorDetailsMock.mockResolvedValue(buildDetails());

    renderPage();

    await waitForMonitorHeading();

    fetchMonitorDetailsMock.mockResolvedValue(
      buildDetails({
        sla: {
          ...buildDetails().sla,
          period: "30d",
          status: "breached",
        },
      }),
    );

    const slaSection = screen
      .getByRole("heading", { name: "SLA" })
      .closest("section");
    expect(slaSection).not.toBeNull();
    await fireEvent.click(
      within(slaSection as HTMLElement).getByRole("button", { name: "30d" }),
    );

    await waitFor(() => {
      expect(fetchMonitorDetailsMock).toHaveBeenLastCalledWith(
        "monitor-1",
        "24h",
        "30d",
      );
    });
  });

  it("shows empty check history message", async () => {
    fetchMonitorDetailsMock.mockResolvedValue(buildDetails({ checks: [] }));

    renderPage();

    expect(
      await screen.findByText("Este monitor ainda não possui histórico."),
    ).toBeInTheDocument();
  });

  it("shows open incident and active maintenance", async () => {
    fetchMonitorDetailsMock.mockResolvedValue(
      buildDetails({
        status: "down",
        openIncident: {
          id: "incident-1",
          monitorId: "monitor-1",
          status: "open",
          startedAt: "2026-08-14T11:00:00.000Z",
          reason: "Monitor check failed",
        },
        incidents: [
          {
            id: "incident-1",
            monitorId: "monitor-1",
            status: "open",
            startedAt: "2026-08-14T11:00:00.000Z",
            reason: "Monitor check failed",
          },
        ],
        activeMaintenance: {
          active: true,
          maintenance: {
            id: "maint-1",
            monitorId: "monitor-1",
            title: "Deploy",
            startsAt: "2026-08-14T10:00:00.000Z",
            endsAt: "2026-08-14T13:00:00.000Z",
            createdAt: "2026-08-14T09:00:00.000Z",
          },
        },
        maintenance: [
          {
            id: "maint-1",
            monitorId: "monitor-1",
            title: "Deploy",
            startsAt: "2026-08-14T10:00:00.000Z",
            endsAt: "2026-08-14T13:00:00.000Z",
            createdAt: "2026-08-14T09:00:00.000Z",
          },
        ],
      }),
    );

    renderPage();

    await waitForMonitorHeading();

    expect(screen.getAllByText("Em manutenção").length).toBeGreaterThan(0);
    expect(screen.getByText("Incidentes abertos")).toBeInTheDocument();
  });

  it("refreshes data when update button is clicked", async () => {
    fetchMonitorDetailsMock.mockResolvedValue(buildDetails());

    renderPage();

    await waitForMonitorHeading();

    await fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));

    await waitFor(() => {
      expect(fetchMonitorDetailsMock).toHaveBeenCalledTimes(2);
    });
  });
});
