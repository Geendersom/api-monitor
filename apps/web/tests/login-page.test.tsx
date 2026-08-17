import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "../src/App.js";
import { LoginPage } from "../src/pages/LoginPage.js";

describe("LoginPage", () => {
  it("renders email and password fields", () => {
    sessionStorage.clear();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    sessionStorage.clear();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "API Monitor" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Visão Geral" })).not.toBeInTheDocument();
  });

  it("allows access after submitting login form", async () => {
    sessionStorage.clear();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Visão Geral" })).toBeInTheDocument();
    });
  });
});
