import { describe, expect, it } from "vitest";

import {
  formatSlaStatus,
  getMaintenanceWindowStatus,
} from "../src/services/formatters.js";

describe("formatters", () => {
  it("formats SLA status labels", () => {
    expect(formatSlaStatus("compliant")).toBe("Compliant");
    expect(formatSlaStatus("breached")).toBe("Breached");
  });

  it("detects maintenance window status", () => {
    const now = new Date("2026-08-14T12:00:00.000Z");

    expect(
      getMaintenanceWindowStatus(
        "2026-08-14T11:00:00.000Z",
        "2026-08-14T13:00:00.000Z",
        now,
      ),
    ).toBe("active");

    expect(
      getMaintenanceWindowStatus(
        "2026-08-14T13:00:00.000Z",
        "2026-08-14T14:00:00.000Z",
        now,
      ),
    ).toBe("upcoming");

    expect(
      getMaintenanceWindowStatus(
        "2026-08-14T09:00:00.000Z",
        "2026-08-14T10:00:00.000Z",
        now,
      ),
    ).toBe("past");
  });
});
