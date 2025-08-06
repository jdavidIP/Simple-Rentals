import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Unauthorized from "../../pages/util/Unauthorized";
import { MemoryRouter } from "react-router-dom";

describe("Unauthorized Page", () => {
  it("renders the unauthorized message and home link", () => {
    render(
      <MemoryRouter>
        <Unauthorized />
      </MemoryRouter>
    );

    // Check for title
    expect(screen.getByText("401 - Unauthorized")).toBeInTheDocument();

    // Check for message
    expect(screen.getByText("You do not have permission to view this page.")).toBeInTheDocument();

    // Check for button
    const button = screen.getByRole("link", { name: /go to home/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", "/");
  });
});
