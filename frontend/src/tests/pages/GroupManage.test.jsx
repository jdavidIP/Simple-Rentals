import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

// Mocks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "42" }),
    useNavigate: () => vi.fn(), // Avoid real navigation in tests
  };
});

// Mock Unauthorized to avoid Router issues
vi.mock("../../pages/Unauthorized.jsx", () => ({
  default: () => <div data-testid="unauthorized">Not allowed</div>
}));

const isProfileSelfMock = vi.fn();
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: () => ({
    isProfileSelf: isProfileSelfMock
  })
}));

vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  }
}));

import GroupManage from "../../pages/GroupManage";
import api from "../../api";

describe("GroupManage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Example data
  const groupData = {
    id: 42,
    name: "My Test Group",
    description: "A test group.",
    move_in_date: "2025-10-01",
    move_in_ready: true,
    group_status: "U",
    members: [
      {
        id: 1,
        user: { first_name: "Alice", last_name: "Smith", email: "alice@email.com" }
      }
    ],
    listing: 24,
  };

  const listingData = {
    id: 24,
    owner: { id: 99 },
    unit_number: "301",
    street_address: "123 Main St",
    city: "Toronto",
    postal_code: "A1A1A1",
  };

  test("shows loading initially and then group/manage UI when authorized", async () => {
    // API mocks
    api.get.mockImplementation((url) => {
      if (url === "/groups/42") return Promise.resolve({ data: groupData });
      if (url === "/listings/24") return Promise.resolve({ data: listingData });
      return Promise.reject(new Error("404"));
    });
    isProfileSelfMock.mockReturnValue(true);

    render(<GroupManage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("My Test Group")).toBeInTheDocument()
    );
    expect(screen.getByText("A test group.")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith (alice@email.com)")).toBeInTheDocument();
    expect(screen.getByLabelText(/Change Group Status/i)).toBeInTheDocument();
  });

  test("shows unauthorized message if user is not the listing owner", async () => {
    // Group fetch returns listingData with owner id = 42, user is not owner
    api.get.mockImplementation((url) => {
      if (url === "/groups/42") return Promise.resolve({ data: groupData });
      if (url === "/listings/24") return Promise.resolve({
        data: { ...listingData, owner: { id: 111 } }
      });
      return Promise.reject(new Error("404"));
    });
    isProfileSelfMock.mockReturnValue(false);

    render(<GroupManage />);
    await waitFor(() =>
      expect(screen.getByTestId("unauthorized")).toBeInTheDocument()
    );
    expect(screen.getByText("Not allowed")).toBeInTheDocument();
  });

  test("shows error on group API failure", async () => {
    api.get.mockRejectedValueOnce(new Error("API error"));
    render(<GroupManage />);
    await waitFor(() =>
      expect(screen.getByText("Failed to fetch group.")).toBeInTheDocument()
    );
  });

  test("shows error on listing API failure", async () => {
    // First call for group, second call for listing (which fails)
    api.get.mockImplementation((url) => {
      if (url === "/groups/42") return Promise.resolve({ data: groupData });
      if (url === "/listings/24") return Promise.reject(new Error("API error"));
      return Promise.reject(new Error("404"));
    });
    isProfileSelfMock.mockReturnValue(true);

    render(<GroupManage />);
    await waitFor(() =>
      expect(screen.getByText("Failed to fetch listing.")).toBeInTheDocument()
    );
  });

  test("changes status when select and button are used", async () => {
    // Group and listing fetch, then patch
    api.get.mockImplementation((url) => {
      if (url === "/groups/42") return Promise.resolve({ data: groupData });
      if (url === "/listings/24") return Promise.resolve({ data: listingData });
      return Promise.reject(new Error("404"));
    });
    api.patch.mockResolvedValue({}); // simulate success
    isProfileSelfMock.mockReturnValue(true);

    render(<GroupManage />);
    await waitFor(() => screen.getByText("My Test Group"));

    // Select a new status
    const select = screen.getByLabelText(/Change Group Status/i);
    fireEvent.change(select, { target: { value: "R" } });

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    // Click button
    const btn = screen.getByRole("button", { name: /Change Status/i });
    fireEvent.click(btn);

    // Should call patch with right arguments
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/groups/manage/42", { group_status: "R" })
    );
  });
});
