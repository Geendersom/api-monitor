import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PeriodSelector } from "../src/components/ui/PeriodSelector.js";

describe("PeriodSelector", () => {
  it("changes the selected period", () => {
    const onChange = vi.fn();

    render(<PeriodSelector value="24h" onChange={onChange} label="uptime" />);

    fireEvent.click(screen.getByRole("button", { name: "7d" }));

    expect(onChange).toHaveBeenCalledWith("7d");
  });
});
