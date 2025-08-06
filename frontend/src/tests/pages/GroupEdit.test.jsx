import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

// --- Mock react-router-dom (useParams) ---
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "99" })
  };
});

// --- Mock FormGroup ---
vi.mock("../../components/forms/FormGroup", () => ({
  default: ({ group }) => <div data-testid="form-group">Editing {group?.name}</div>
}));

// --- Mock Unauthorized ---
vi.mock("../../pages/util/Unauthorized.jsx", () => ({
  default: () => <div data-testid="unauthorized">Not allowed</div>
}));

// --- Mock context ---
const isProfileSelfMock = vi.fn();
vi.mock("../../contexts/ProfileContext.jsx", () => ({
  useProfileContext: () => ({
    isProfileSelf: isProfileSelfMock
  })
}));

// --- Mock API ---
vi.mock("../../api.js", () => ({
  default: {
    get: vi.fn()
  }
}));

// --- Import after mocks ---
import GroupEdit from "../../pages/group/GroupEdit";
import api from "../../api";

describe("GroupEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Add required properties to avoid destructure error in FormGroup.jsx
  const groupData = {
    id: 99,
    name: "My Group",
    owner: { user: { id: 1 } },
    group_status: ["O"],
    move_in_date: "",
    move_in_ready: false,
    members: [],
  };

  test("shows loading initially and then form when authorized", async () => {
    api.get.mockResolvedValue({ data: groupData });
    isProfileSelfMock.mockReturnValue(true);

    render(
      <MemoryRouter>
        <GroupEdit />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("form-group")).toBeInTheDocument();
    expect(screen.getByText("Editing My Group")).toBeInTheDocument();
  });

  test("shows unauthorized message if user is not the owner", async () => {
    api.get.mockResolvedValue({
      data: { ...groupData, owner: { user: { id: 2 } } }
    });
    isProfileSelfMock.mockReturnValue(false);

    render(
      <MemoryRouter>
        <GroupEdit />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByTestId("unauthorized")).toBeInTheDocument()
    );
    expect(screen.getByText("Not allowed")).toBeInTheDocument();
  });

  test("shows error on API failure", async () => {
    api.get.mockRejectedValue(new Error("API error"));
    render(
      <MemoryRouter>
        <GroupEdit />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText("Failed to fetch group.")).toBeInTheDocument()
    );
  });
});
