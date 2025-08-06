import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "../../pages/util/NotFound";

// Setup navigate spy
const navigateSpy = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

describe("NotFound Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 404 and text content", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/Oops! Page not found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/The page you're looking for doesn't exist/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Or enjoy some silence/i)).toBeInTheDocument();
  });

  it("navigates to '/' when Go Home is clicked", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    const goHomeButton = screen.getByRole("button", { name: /go home/i });
    fireEvent.click(goHomeButton);

    expect(navigateSpy).toHaveBeenCalledWith("/");
  });

  it("navigates back when Try Previous Page is clicked", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    const goBackButton = screen.getByRole("button", { name: /try previous page/i });
    fireEvent.click(goBackButton);

    expect(navigateSpy).toHaveBeenCalledWith(-1);
  });
});
