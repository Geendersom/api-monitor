import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MonitorFormModal } from "../src/components/monitors/MonitorFormModal.js";

describe("MonitorFormModal", () => {
  it("submits create form with name and url", () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <MonitorFormModal
        open
        mode="create"
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/API de Produção/i), {
      target: { value: "Nova API" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/api.exemplo.com\/health/i),
      {
        target: { value: "https://nova.example.com/health" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /Adicionar/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Nova API",
      url: "https://nova.example.com/health",
    });
  });

  it("prefills edit form with monitor values", () => {
    render(
      <MonitorFormModal
        open
        mode="edit"
        initialValues={{
          name: "Auth Service",
          url: "https://auth.example.com",
        }}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Auth Service")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://auth.example.com"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar/i })).toBeInTheDocument();
  });
});
