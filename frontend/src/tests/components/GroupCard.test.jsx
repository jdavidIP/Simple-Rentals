import { describe, it, vi, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GroupCard from "../../components/cards/GroupCard";
import { MemoryRouter } from "react-router-dom";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("GroupCard Component", () => {
  const mockGroup = {
    id: 42,
    name: "housemates",
    description: "Looking for a cozy place downtown.",
    move_in_date: "2025-09-01",
    group_status: "Open",
    move_in_ready: true,
    members: [{}, {}, {}],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders group details correctly", () => {
    render(
      <MemoryRouter>
        <GroupCard group={mockGroup} />
      </MemoryRouter>
    );

    expect(screen.getByText(/housemates/i)).toBeInTheDocument();
    expect(screen.getByText(/cozy place downtown/i)).toBeInTheDocument();
    expect(screen.getByText(/2025-09-01/)).toBeInTheDocument();
    expect(screen.getByText(/open/i)).toBeInTheDocument();
    expect(screen.getByText(/yes/i)).toBeInTheDocument();
    expect(screen.getByText(/members/i)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /housemates/i })).toBeInTheDocument();
  });

  it("navigates to group details on click", () => {
    render(
      <MemoryRouter>
        <GroupCard group={mockGroup} />
      </MemoryRouter>
    );
    // Find the article by role "button"
    const card = screen.getByRole("button", { name: /housemates/i });
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith("/groups/42");
  });
});
