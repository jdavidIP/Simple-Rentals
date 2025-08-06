import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

// Fix jsdom scrollIntoView
window.HTMLElement.prototype.scrollIntoView = () => {};

// Mocks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "888" }),
    useNavigate: () => vi.fn(),
  };
});

const isProfileSelfMock = vi.fn();
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: () => ({
    isProfileSelf: isProfileSelfMock
  })
}));

// Mock GroupCard to display group name only
vi.mock("../../components/group/GroupCard", () => ({
  __esModule: true,
  default: ({ group }) => (
    <div data-testid="group-card">{group.name}</div>
  )
}));

vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
  }
}));

import Groups from "../../pages/group/Groups";
import api from "../../api";

describe("Groups page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fakeGroups = [
    { id: 1, name: "First Group" },
    { id: 2, name: "Second Group" }
  ];
  const fakeOwnerId = 555;

  test("shows loading initially, then lists groups and Open a Group if not owner", async () => {
    // /listings/:id/groups and /listings/:id
    api.get.mockImplementation((url) => {
      if (url.endsWith("/groups")) return Promise.resolve({ data: fakeGroups });
      if (url.endsWith("/listings/888")) return Promise.resolve({ data: { owner: { id: fakeOwnerId } } });
      return Promise.reject(new Error("404"));
    });
    isProfileSelfMock.mockReturnValue(false);

    render(<Groups />);

    // Matches "Loading listing…" (with Unicode ellipsis)
    expect(screen.getByText(/loading listing/i)).toBeInTheDocument();

    // Wait for "Available Groups" to appear
    await waitFor(() =>
      expect(screen.getByText(/available groups/i)).toBeInTheDocument()
    );

    // Not owner: show "Open a Group" button
    expect(screen.getByRole("button", { name: /Open a Group/i })).toBeInTheDocument();

    // Show both group cards
    expect(screen.getByText("First Group")).toBeInTheDocument();
    expect(screen.getByText("Second Group")).toBeInTheDocument();
  });

  test("shows loading initially, then lists groups but no 'Open a Group' if owner", async () => {
    api.get.mockImplementation((url) => {
      if (url.endsWith("/groups")) return Promise.resolve({ data: fakeGroups });
      if (url.endsWith("/listings/888")) return Promise.resolve({ data: { owner: { id: fakeOwnerId } } });
      return Promise.reject(new Error("404"));
    });
    isProfileSelfMock.mockReturnValue(true);

    render(<Groups />);
    await waitFor(() =>
      expect(screen.getByText(/available groups/i)).toBeInTheDocument()
    );
    // No Open button for owners
    expect(screen.queryByRole("button", { name: /Open a Group/i })).toBeNull();
    expect(screen.getByText("First Group")).toBeInTheDocument();
    expect(screen.getByText("Second Group")).toBeInTheDocument();
  });

  test("shows empty message if no groups", async () => {
    api.get.mockImplementation((url) => {
      if (url.endsWith("/groups")) return Promise.resolve({ data: [] });
      if (url.endsWith("/listings/888")) return Promise.resolve({ data: { owner: { id: fakeOwnerId } } });
      return Promise.reject(new Error("404"));
    });
    isProfileSelfMock.mockReturnValue(false);

    render(<Groups />);
    await waitFor(() =>
      expect(screen.getByText("No groups found for this listing.")).toBeInTheDocument()
    );
  });

  test("shows error if groups fetch fails", async () => {
    api.get.mockImplementation((url) => {
      if (url.endsWith("/groups")) return Promise.reject(new Error("API fail"));
      if (url.endsWith("/listings/888")) return Promise.resolve({ data: { owner: { id: fakeOwnerId } } });
      return Promise.reject(new Error("404"));
    });
    isProfileSelfMock.mockReturnValue(false);

    render(<Groups />);
    await waitFor(() =>
      expect(screen.getByText("Failed to fetch groups.")).toBeInTheDocument()
    );
  });

  test("shows error if listing owner fetch fails", async () => {
    api.get.mockImplementation((url) => {
      if (url.endsWith("/groups")) return Promise.resolve({ data: fakeGroups });
      if (url.endsWith("/listings/888")) return Promise.reject(new Error("fail"));
      return Promise.reject(new Error("404"));
    });
    isProfileSelfMock.mockReturnValue(false);

    render(<Groups />);
    await waitFor(() =>
      expect(screen.getByText("Failed to get listing's owner.")).toBeInTheDocument()
    );
  });
});
