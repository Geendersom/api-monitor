import { describe, expect, it } from "vitest";

import { validateMonitorForm } from "../src/services/monitor-management.js";

describe("validateMonitorForm", () => {
  it("rejects empty name", () => {
    expect(
      validateMonitorForm({ name: "  ", url: "https://example.com" }),
    ).toBe("Informe um nome para a API.");
  });

  it("rejects invalid url", () => {
    expect(
      validateMonitorForm({ name: "API", url: "not-a-url" }),
    ).toBe("A URL deve ser válida (http:// ou https://).");
  });

  it("accepts valid input", () => {
    expect(
      validateMonitorForm({
        name: "API",
        url: "https://example.com/health",
      }),
    ).toBeNull();
  });
});
