import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { TopNav } from "../src/components/layout/TopNav.js";

describe("TopNav", () => {
  it("renders primary navigation links", () => {
    render(
      <MemoryRouter>
        <TopNav
          operational
          menuOpen={false}
          onMenuToggle={() => undefined}
          onMenuClose={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Monitores" })).toHaveAttribute(
      "href",
      "/monitors",
    );
    expect(screen.getByRole("link", { name: "Incidentes" })).toHaveAttribute(
      "href",
      "/incidents",
    );
    expect(screen.getByRole("link", { name: "Alertas" })).toHaveAttribute(
      "href",
      "/alerts",
    );
    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });
});
