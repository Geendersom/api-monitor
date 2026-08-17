import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "../src/components/layout/Sidebar.js";
import { clearAuthenticated, setAuthenticated } from "../src/auth/session.js";

describe("Sidebar", () => {
  it("renders primary navigation links", () => {
    render(
      <MemoryRouter>
        <Sidebar open={false} operational onClose={() => undefined} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Visão Geral" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "APIs Monitoradas" }),
    ).toHaveAttribute("href", "/monitors");
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

  it("shows favicon and logs out when user area is clicked", () => {
    setAuthenticated();
    const onClose = vi.fn();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={<Sidebar open={false} operational onClose={onClose} />}
          />
          <Route path="/login" element={<div>Página de login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const logoutButton = screen.getByRole("button", { name: "Sair da conta" });

    expect(logoutButton.querySelector(".sidebar__user-icon")).toHaveAttribute(
      "src",
      expect.stringContaining("sidebar-user-avatar"),
    );

    fireEvent.click(logoutButton);

    expect(onClose).toHaveBeenCalled();
    expect(screen.getByText("Página de login")).toBeInTheDocument();

    clearAuthenticated();
  });
});
