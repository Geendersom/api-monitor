import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { DashboardMonitorsTable } from "../src/components/monitors/DashboardMonitorsTable.js";
import type { MonitorWithStatus } from "../src/types/api.js";

const monitor: MonitorWithStatus = {
  id: "monitor-1",
  name: "API Principal",
  url: "https://example.com/health",
  status: "up",
  hasOpenIncident: false,
  lastCheckedAt: "2026-08-14T12:00:00.000Z",
  responseTimeMs: 120,
};

describe("DashboardMonitorsTable actions", () => {
  it("opens more menu and calls edit handler", () => {
    const onEditMonitor = vi.fn();

    render(
      <MemoryRouter>
        <DashboardMonitorsTable
          monitors={[monitor]}
          searchQuery=""
          onEditMonitor={onEditMonitor}
          onDeleteMonitor={vi.fn()}
          onTogglePauseMonitor={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Mais opções de API Principal/i }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /Editar/i }));

    expect(onEditMonitor).toHaveBeenCalledWith(monitor);
  });

  it("calls edit handler from edit button", () => {
    const onEditMonitor = vi.fn();

    render(
      <MemoryRouter>
        <DashboardMonitorsTable
          monitors={[monitor]}
          searchQuery=""
          onEditMonitor={onEditMonitor}
          onDeleteMonitor={vi.fn()}
          onTogglePauseMonitor={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Editar API Principal/i }));

    expect(onEditMonitor).toHaveBeenCalledWith(monitor);
  });
});
