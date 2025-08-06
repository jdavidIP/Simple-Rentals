import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConversationCard from "../../components/cards/ConversationCard";
import { MemoryRouter } from "react-router-dom";

// Mock profile context
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: () => ({
    profile: { id: 1, name: "Test User" },
  }),
}));

// Mock useNavigate
const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock API
vi.mock("../../api", () => ({
  default: {
    post: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  },
}));

describe("ConversationCard", () => {
  const baseConv = {
    id: 123,
    participants: [
      { id: 1, full_name: "Test User" },
      { id: 2, full_name: "Other User" }
    ],
    listing: { street_address: "123 Main St" },
    last_updated: new Date().toISOString(),
    last_message: { content: "Hello" },
    isGroup: false,
  };

  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("renders conversation data", () => {
    render(
      <MemoryRouter>
        <ConversationCard conv={baseConv} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Listing:/)).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leave" })).toBeInTheDocument();
  });

  it("shows Leave button if user is only participant", () => {
    const conv = { 
      ...baseConv, 
      participants: [{ id: 1, full_name: "Test User" }]
    };
    render(
      <MemoryRouter>
        <ConversationCard conv={conv} />
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: "Leave" })).toBeInTheDocument();
  });

  it("navigates to conversation on click", () => {
    render(
      <MemoryRouter>
        <ConversationCard conv={baseConv} />
      </MemoryRouter>
    );
    const li = screen.getByText(/Listing:/).closest("li");
    fireEvent.click(li);
    expect(navigateMock).toHaveBeenCalledWith("/conversations/123");
  });

  it("does NOT render button for group conversation", () => {
    const conv = { ...baseConv, isGroup: true };
    render(
      <MemoryRouter>
        <ConversationCard conv={conv} />
      </MemoryRouter>
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
