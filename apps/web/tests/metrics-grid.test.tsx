import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MetricsGrid } from "../src/components/metrics/MetricsGrid.js";
import type { DashboardOverview } from "../src/types/api.js";

const overview: DashboardOverview = {
  totalMonitors: 4,
  upMonitors: 3,
  downMonitors: 1,
  openIncidents: 1,
  resolvedIncidents: 2,
  totalAlerts: 7,
  recentAlerts: [],
  overallUptimePercentage: 99.97,
  averageResponseTimeMs: 243,
  period: "24h",
  from: "2026-08-13T12:00:00.000Z",
  to: "2026-08-14T12:00:00.000Z",
};

describe("MetricsGrid", () => {
  it("opens modal when alert metric is clicked", () => {
    const onOpenModal = vi.fn();

    render(<MetricsGrid overview={overview} onOpenModal={onOpenModal} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Ver detalhes de Alertas/i }),
    );

    expect(onOpenModal).toHaveBeenCalledWith("alerts");
  });
});
