import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, vi, beforeEach } from "vitest";
import VerifyEmail from "../../pages/VerifyEmail";
import api from "../../api";

// Mock API
vi.mock("../../api", () => ({
  default: {
    post: vi.fn(),
  },
}));

const renderWithParams = (search = "") => {
  return render(
    <MemoryRouter initialEntries={[`/verify${search}`]}>
      <Routes>
        <Route path="/verify" element={<VerifyEmail />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("VerifyEmail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays success message when verification succeeds", async () => {
    api.post.mockResolvedValueOnce({});

    renderWithParams("?uid=test123&token=abc456");

    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Your email has been verified! You can now log in.")
      ).toBeInTheDocument();
    });

    const button = screen.getByRole("link", { name: /back to login/i });
    expect(button).toHaveClass("verify-btn");
  });

  it("displays error message when verification fails with server error", async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { detail: "Invalid or expired token." } },
    });

    renderWithParams("?uid=test123&token=invalid");

    await waitFor(() => {
      expect(screen.getByText("Invalid or expired token.")).toBeInTheDocument();
    });

    const button = screen.getByRole("link", { name: /back to login/i });
    expect(button).toHaveClass("verify-btn-outline");
  });

  it("displays fallback error message when API throws generic error", async () => {
    api.post.mockRejectedValueOnce({});

    renderWithParams("?uid=test123&token=bad");

    await waitFor(() => {
      expect(
        screen.getByText(/verification link is invalid or expired/i)
      ).toBeInTheDocument();
    });
  });

  it("shows error message when uid or token is missing", () => {
    renderWithParams(); // no query params

    expect(
      screen.getByText("Missing verification info in the link.")
    ).toBeInTheDocument();

    const button = screen.getByRole("link", { name: /back to login/i });
    expect(button).toHaveClass("verify-btn-outline");
  });
});
