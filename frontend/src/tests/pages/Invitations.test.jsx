import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

// Mock ProfileContext BEFORE import
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: vi.fn(),
}));

// Mock InvitationCard to a stub
vi.mock("../../components/InvitationCard", () => ({
  __esModule: true,
  default: ({ invitation }) => (
    <div data-testid="invitation-card">{invitation.group_name}</div>
  ),
}));

import Invitations from "../../pages/Invitations";
import { useProfileContext } from "../../contexts/ProfileContext";

describe("Invitations page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading and error alerts", () => {
    useProfileContext.mockReturnValue({
      invitations: { received: [], sent: [] },
      invitationsLoading: true,
      invitationsError: "Oh no!",
      fetchInvitations: vi.fn(),
    });

    render(<Invitations />);
    expect(screen.getByText(/loading invitations/i)).toBeInTheDocument();
    expect(screen.getByText(/oh no/i)).toBeInTheDocument();
  });

  it("renders received invitations with correct status sections", () => {
    useProfileContext.mockReturnValue({
      invitations: {
        received: [
          { id: 1, group_name: "My Group 1", accepted: null },
          { id: 2, group_name: "My Group 2", accepted: true },
        ],
        sent: [],
      },
      invitationsLoading: false,
      invitationsError: null,
      fetchInvitations: vi.fn(),
    });

    render(<Invitations />);
    // Tabs default to received
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    // Card stubs
    expect(screen.getAllByTestId("invitation-card").length).toBe(2);
    expect(screen.getByText("My Group 1")).toBeInTheDocument();
    expect(screen.getByText("My Group 2")).toBeInTheDocument();
  });

  it("renders sent invitations, with all sections, and can switch tabs", () => {
    useProfileContext.mockReturnValue({
      invitations: {
        received: [],
        sent: [
          { id: 3, group_name: "Sent 1", accepted: null },
          { id: 4, group_name: "Sent 2", accepted: true },
          { id: 5, group_name: "Sent 3", accepted: false },
        ],
      },
      invitationsLoading: false,
      invitationsError: null,
      fetchInvitations: vi.fn(),
    });

    render(<Invitations />);
    fireEvent.click(screen.getByText("Sent"));
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getAllByTestId("invitation-card").length).toBe(3);
    expect(screen.getByText("Sent 1")).toBeInTheDocument();
    expect(screen.getByText("Sent 2")).toBeInTheDocument();
    expect(screen.getByText("Sent 3")).toBeInTheDocument();
  });

  it("shows empty states when there are no invitations", () => {
    useProfileContext.mockReturnValue({
      invitations: { received: [], sent: [] },
      invitationsLoading: false,
      invitationsError: null,
      fetchInvitations: vi.fn(),
    });

    render(<Invitations />);
    expect(screen.getByText(/no pending invitations/i)).toBeInTheDocument();
    expect(screen.getByText(/no accepted invitations/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Sent"));
    expect(screen.getByText(/no pending invitations/i)).toBeInTheDocument();
    expect(screen.getByText(/no accepted invitations/i)).toBeInTheDocument();
    expect(screen.getByText(/no rejected invitations/i)).toBeInTheDocument();
  });

  it("shows received tab as default, can switch to sent and back", () => {
    useProfileContext.mockReturnValue({
      invitations: { received: [], sent: [] },
      invitationsLoading: false,
      invitationsError: null,
      fetchInvitations: vi.fn(),
    });

    render(<Invitations />);
    expect(screen.getByRole("button", { name: "Received" }).className).toMatch(/active/);
    fireEvent.click(screen.getByRole("button", { name: "Sent" }));
    expect(screen.getByRole("button", { name: "Sent" }).className).toMatch(/active/);
    fireEvent.click(screen.getByRole("button", { name: "Received" }));
    expect(screen.getByRole("button", { name: "Received" }).className).toMatch(/active/);
  });
});
