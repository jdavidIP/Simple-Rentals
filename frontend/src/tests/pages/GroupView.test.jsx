import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { vi } from "vitest";

import GroupView from "../../pages/GroupView";
import api from "../../api";
import * as router from "react-router-dom";
import * as profileContext from "../../contexts/ProfileContext";

// Mock router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "123" }),
    useNavigate: () => vi.fn(),
    Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
  };
});

// Mock profile context
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: vi.fn()
}));

// Mock API
vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock CSS
vi.mock("../../styles/groups.css", () => ({}));

describe("GroupView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default profile context mock
    vi.mocked(profileContext.useProfileContext).mockReturnValue({
      profile: { id: 1, first_name: "John", last_name: "Doe" },
      roommate: { id: 1, user: { id: 1 } },
      isProfileSelf: (id) => id === 1
    });
  });

  const mockGroup = {
    id: 123,
    name: "Test Group",
    description: "A test group description",
    move_in_date: "2024-01-01",
    group_status: "O",
    move_in_ready: true,
    listing: 456,
    owner: {
      user: { id: 1, first_name: "John", last_name: "Doe" }
    },
    members: [
      {
        id: 1,
        user: {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          sex: "M",
          preferred_location: "Toronto",
          yearly_income: 60000,
          profile_picture: null
        },
        roommate_budget: 1500,
        description: "Looking for a clean roommate"
      },
      {
        id: 2,
        user: {
          id: 2,
          first_name: "Jane",
          last_name: "Smith",
          sex: "F",
          preferred_location: "Vancouver",
          yearly_income: 80000,
          profile_picture: "/static/img/jane.jpg"
        },
        roommate_budget: 2000,
        description: "Love cooking and quiet evenings"
      }
    ]
  };

  const mockListing = {
    id: 456,
    price: 1200,
    owner: { id: 3, first_name: "Bob", last_name: "Builder" }
  };

  const mockConversation = {
    id: 789,
    listing: mockListing,
    participants: ["1", "2"]
  };

  test("renders loading then group content", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/groups/123") return Promise.resolve({ data: mockGroup });
      if (url === "/listings/456") return Promise.resolve({ data: mockListing });
      if (url === "/conversations/") return Promise.resolve({ data: [mockConversation] });
      return Promise.reject(new Error("Not found"));
    });

    render(<GroupView />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Test Group")).toBeInTheDocument();
    expect(screen.getByText("A test group description")).toBeInTheDocument();
    expect(screen.getByText("2024-01-01")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  test("shows error if group fetch fails", async () => {
    api.get.mockRejectedValue(new Error("API Error"));

    render(<GroupView />);

    await waitFor(() =>
      expect(screen.getByText("Failed to fetch group details.")).toBeInTheDocument()
    );
  });

  test("displays group members with correct information", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/groups/123") return Promise.resolve({ data: mockGroup });
      if (url === "/listings/456") return Promise.resolve({ data: mockListing });
      if (url === "/conversations/") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("Not found"));
    });

    render(<GroupView />);

    await waitFor(() => {
      expect(screen.getByText("Budget: $1,500")).toBeInTheDocument();
      expect(screen.getByText("Budget: $2,000")).toBeInTheDocument();
      expect(screen.getByText("Toronto")).toBeInTheDocument();
      expect(screen.getByText("Vancouver")).toBeInTheDocument();
      expect(screen.getByText("Looking for a clean roommate")).toBeInTheDocument();
    });
  });

  test("allows group owner to delete group with confirmation", async () => {
    const mockNavigate = vi.fn();
    vi.spyOn(router, "useNavigate").mockReturnValue(mockNavigate);
    
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    api.get.mockImplementation((url) => {
      if (url === "/groups/123") return Promise.resolve({ data: mockGroup });
      if (url === "/listings/456") return Promise.resolve({ data: mockListing });
      if (url === "/conversations/") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("Not found"));
    });
    api.delete.mockResolvedValue({});

    render(<GroupView />);

    await waitFor(() => {
      expect(screen.getByText("Delete Group")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Delete Group"));
    });

    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this group? This action cannot be undone."
    );
    expect(api.delete).toHaveBeenCalledWith("/groups/delete/123");

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  test("allows non-owner member to leave group", async () => {
    const memberGroup = {
      ...mockGroup,
      owner: { user: { id: 999, first_name: "Other", last_name: "Owner" } }
    };

    const mockNavigate = vi.fn();
    vi.spyOn(router, "useNavigate").mockReturnValue(mockNavigate);
    
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    api.get.mockImplementation((url) => {
      if (url === "/groups/123") return Promise.resolve({ data: memberGroup });
      if (url === "/listings/456") return Promise.resolve({ data: mockListing });
      if (url === "/conversations/") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("Not found"));
    });
    api.patch.mockResolvedValue({});

    render(<GroupView />);

    await waitFor(() => {
      expect(screen.getByText("Leave Group")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Leave Group"));
    });

    expect(api.patch).toHaveBeenCalledWith("/groups/123/leave");

    window.confirm = originalConfirm;
  });

  test("allows non-member with roommate profile to join group", async () => {
    const nonMemberGroup = {
      ...mockGroup,
      members: [mockGroup.members[1]] // Only Jane, not John
    };

    vi.mocked(profileContext.useProfileContext).mockReturnValue({
      profile: { id: 999, first_name: "New", last_name: "User" },
      roommate: { id: 999, user: { id: 999 } },
      isProfileSelf: () => false
    });

    api.get.mockImplementation((url) => {
      if (url === "/groups/123") return Promise.resolve({ data: nonMemberGroup });
      if (url === "/listings/456") return Promise.resolve({ data: mockListing });
      if (url === "/conversations/") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("Not found"));
    });
    
    // Mock successful join and refetch
    api.patch.mockResolvedValue({});

    render(<GroupView />);

    await waitFor(() => {
      expect(screen.getByText("Join Group")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Join Group"));
    });

    expect(api.patch).toHaveBeenCalledWith("/groups/123/join");
  });

  test("shows create roommate profile button when user has no roommate", async () => {
    const mockNavigate = vi.fn();
    vi.spyOn(router, "useNavigate").mockReturnValue(mockNavigate);

    vi.mocked(profileContext.useProfileContext).mockReturnValue({
      profile: { id: 999, first_name: "New", last_name: "User" },
      roommate: null,
      isProfileSelf: () => false
    });

    api.get.mockImplementation((url) => {
      if (url === "/groups/123") return Promise.resolve({ data: mockGroup });
      if (url === "/listings/456") return Promise.resolve({ data: mockListing });
      if (url === "/conversations/") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("Not found"));
    });

    render(<GroupView />);

    await waitFor(() => {
      expect(screen.getByText("Create Roommate Profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create Roommate Profile"));

    expect(mockNavigate).toHaveBeenCalledWith("/roommates/post");
  });

  test("starts new conversation when none exists", async () => {
    const mockNavigate = vi.fn();
    vi.spyOn(router, "useNavigate").mockReturnValue(mockNavigate);

    api.get.mockImplementation((url) => {
      if (url === "/groups/123") return Promise.resolve({ data: mockGroup });
      if (url === "/listings/456") return Promise.resolve({ data: mockListing });
      if (url === "/conversations/") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("Not found"));
    });
    api.post.mockResolvedValue({ data: { id: 999 } });

    render(<GroupView />);

    await waitFor(() => {
      expect(screen.getByText("Start Chat")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Start Chat"));
    });

    expect(api.post).toHaveBeenCalledWith(
      "/listing/456/start_conversation",
      { participants: ["1", "2"] }
    );
    expect(mockNavigate).toHaveBeenCalledWith("/conversations/999");
  });

  test("navigates to existing conversation", async () => {
    const mockNavigate = vi.fn();
    vi.spyOn(router, "useNavigate").mockReturnValue(mockNavigate);

    api.get.mockImplementation((url) => {
      if (url === "/groups/123") return Promise.resolve({ data: mockGroup });
      if (url === "/listings/456") return Promise.resolve({ data: mockListing });
      if (url === "/conversations/") return Promise.resolve({ data: [mockConversation] });
      return Promise.reject(new Error("Not found"));
    });

    render(<GroupView />);

    await waitFor(() => {
      expect(screen.getByText("See Chat")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("See Chat"));

    expect(mockNavigate).toHaveBeenCalledWith("/conversations/789");
  });

  test("shows fit ranking for listing owner", async () => {
    vi.mocked(profileContext.useProfileContext).mockReturnValue({
      profile: { id: 3, first_name: "Bob", last_name: "Builder" }, // Listing owner
      roommate: { id: 3, user: { id: 3 } },
      isProfileSelf: () => false
    });

    api.get.mockImplementation((url) => {
      if (url === "/groups/123") return Promise.resolve({ data: mockGroup });
      if (url === "/listings/456") return Promise.resolve({ data: mockListing });
      if (url === "/conversations/") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("Not found"));
    });

    render(<GroupView />);

    await waitFor(() => {
      // John's income: 60000, monthly: 5000, rent: 1200, ratio: 24% - Good Fit
      expect(screen.getByText("✅ Good Fit — 24.0% income")).toBeInTheDocument();
    });
  });
});