// src/tests/pages/VerifyPending.test.jsx

import { describe, it, beforeEach, vi, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VerifyPending from "../../pages/auth/VerifyPending";
import api from "../../api";

// Mock API
vi.mock("../../api", () => ({
  default: {
    post: vi.fn(),
  },
}));

// Helper to render page with search param
const renderWithSearchParams = (search = "") => {
  render(
    <MemoryRouter initialEntries={[`/verify-pending${search}`]}>
      <Routes>
        <Route path="/verify-pending" element={<VerifyPending />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("VerifyPending Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows email from URL if present", () => {
    renderWithSearchParams("?email=test@example.com");

    expect(
      screen.getByText(/verification email sent to/i)
    ).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows generic message when email is not in URL", () => {
    renderWithSearchParams();

    expect(
      screen.getByText(/please check your email for a verification link/i)
    ).toBeInTheDocument();
  });

  it("resends verification email successfully", async () => {
    api.post.mockResolvedValueOnce({});

    renderWithSearchParams("?email=test@example.com");

    const button = screen.getByRole("button", { name: /resend verification email/i });
    fireEvent.click(button);

    expect(button).toHaveTextContent("Resending...");

    await waitFor(() => {
      expect(screen.getByText(/a new verification email has been sent/i)).toBeInTheDocument();
    });

    // Button text should revert eventually
    await waitFor(() => {
      expect(button).toHaveTextContent("Resend verification email");
    }, { timeout: 4000 }); // allow time for setTimeout
  });

  it("shows error if resend fails", async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { detail: "Invalid email" } },
    });

    renderWithSearchParams("?email=bad@email.com");

    const button = screen.getByRole("button", { name: /resend verification email/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });
  });

  it("falls back to generic error on resend failure", async () => {
    api.post.mockRejectedValueOnce({});

    renderWithSearchParams("?email=bad@email.com");

    const button = screen.getByRole("button", { name: /resend verification email/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to resend/i)).toBeInTheDocument();
    });
  });

  it("disables button during loading", async () => {
    // Simulate a delay in api.post
    api.post.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 1000))
    );

    renderWithSearchParams("?email=test@example.com");

    const button = screen.getByRole("button", { name: /resend verification email/i });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Resending...");
  });
});
