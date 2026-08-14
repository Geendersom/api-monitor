import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MonitorsTable } from "../src/components/monitors/MonitorsTable.js";
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

describe("MonitorsTable", () => {
  it("navigates to monitor details when a row is clicked", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<MonitorsTable monitors={[monitor]} />} />
          <Route
            path="/monitors/:id"
            element={<div>Monitor Details Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("link", { name: /Ver detalhes de API Principal/i }),
    );

    expect(screen.getByText("Monitor Details Page")).toBeInTheDocument();
  });
});
