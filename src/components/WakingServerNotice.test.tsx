import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WakingServerNotice } from "./WakingServerNotice";

describe("WakingServerNotice", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("no aparece en una espera corta y explica la demora si se alarga", async () => {
    render(<WakingServerNotice delayMs={5000} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("El servidor se está activando");
  });
});
