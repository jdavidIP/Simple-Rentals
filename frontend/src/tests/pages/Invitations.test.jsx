import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Invitations from "../../pages/group/Invitations";
import { useProfileContext } from "../../contexts/ProfileContext";

// Mock ProfileContext for all tests
vi.mock("../../contexts/ProfileContext");

function setupContextValue({
  loading = false,
  error = null,
  received = [],
  sent = [],
  fetchInvitations = vi.fn(),
} = {}) {
  useProfileContext.mockReturnValue({
    invitations: { received, sent },
    invitationsLoading: loading,
    invitationsError: error,
    fetchInvitations,
  });
}

describe("Invitations page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading and error alerts", () => {
    // Loading
    setupContextValue({ loading: true });
    render(
      <MemoryRouter>
        <Invitations />
      </MemoryRouter>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Error
    setupContextValue({ error: "Something went wrong" });
    render(
      <MemoryRouter>
        <Invitations />
      </MemoryRouter>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("shows empty states when there are no invitations", () => {
    setupContextValue(); // Both received and sent empty

    render(
      <MemoryRouter>
        <Invitations />
      </MemoryRouter>
    );

    // Default: Received tab
    // Check Pending & Accepted sections
    const pendingSection = screen.getByText("Pending").closest("details");
    const acceptedSection = screen.getByText("Accepted").closest("details");

    expect(
      within(pendingSection).getByText(/no items in.*pending/i)
    ).toBeInTheDocument();
    expect(
      within(acceptedSection).getByText(/no items in.*accepted/i)
    ).toBeInTheDocument();

    // Switch to Sent tab
    fireEvent.click(screen.getByRole("tab", { name: /sent/i }));

    // Sent tab: Pending, Accepted, Rejected
    const pendingSent = screen
      .getAllByText("Pending")
      .find((el) => el.closest("details") && within(el.closest("details")).queryByText(/no items/i));
    const acceptedSent = screen
      .getAllByText("Accepted")
      .find((el) => el.closest("details") && within(el.closest("details")).queryByText(/no items/i));
    const rejectedSent = screen
      .getAllByText("Rejected")
      .find((el) => el.closest("details") && within(el.closest("details")).queryByText(/no items/i));

    expect(
      within(pendingSent.closest("details")).getByText(/no items in.*pending/i)
    ).toBeInTheDocument();
    expect(
      within(acceptedSent.closest("details")).getByText(/no items in.*accepted/i)
    ).toBeInTheDocument();
    expect(
      within(rejectedSent.closest("details")).getByText(/no items in.*rejected/i)
    ).toBeInTheDocument();
  });

  it("shows received tab as default, can switch to sent and back", () => {
    setupContextValue({
      received: [{ id: 1, accepted: null }],
      sent: [{ id: 2, accepted: true }],
    });
    render(
      <MemoryRouter>
        <Invitations />
      </MemoryRouter>
    );

    // Default is Received tab
    expect(
      screen.getByRole("tab", { name: /received/i, selected: true })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /sent/i, selected: false })
    ).toBeInTheDocument();

    // Switch to Sent tab
    fireEvent.click(screen.getByRole("tab", { name: /sent/i }));
    expect(
      screen.getByRole("tab", { name: /sent/i, selected: true })
    ).toBeInTheDocument();

    // Switch back to Received
    fireEvent.click(screen.getByRole("tab", { name: /received/i }));
    expect(
      screen.getByRole("tab", { name: /received/i, selected: true })
    ).toBeInTheDocument();
  });
});
