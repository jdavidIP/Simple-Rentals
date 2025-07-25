import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LogOut from "../../pages/Logout";
import api from "../../api";
import { REFRESH_TOKEN } from "../../constants";

// Setup navigateSpy and mock api
const navigateSpy = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

vi.mock("../../api", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("LogOut Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("clears storage and navigates to login when refresh token is present", async () => {
    localStorage.setItem(REFRESH_TOKEN, "fake-refresh-token");

    render(
      <MemoryRouter>
        <LogOut />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/logout/", {
        refresh: "fake-refresh-token",
      });
    });

    expect(localStorage.getItem(REFRESH_TOKEN)).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith("/login");
  });

  it("still navigates to login if refresh token is missing", async () => {
    render(
      <MemoryRouter>
        <LogOut />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith("/login");
    });
  });

  it("displays logging out message", () => {
    render(
      <MemoryRouter>
        <LogOut />
      </MemoryRouter>
    );

    expect(screen.getByText(/logging out/i)).toBeInTheDocument();
  });
});
