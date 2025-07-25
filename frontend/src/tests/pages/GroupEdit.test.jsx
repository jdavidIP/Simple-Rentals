import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "99" })
  };
});

// Mock FormGroup
vi.mock("../../components/FormGroup", () => ({
  default: ({ group }) => <div data-testid="form-group">Editing {group?.name}</div>
}));

// Mock Unauthorized 
vi.mock("../../pages/Unauthorized.jsx", () => ({
  default: () => <div data-testid="unauthorized">Not allowed</div>
}));

// Mock context
const isProfileSelfMock = vi.fn();
vi.mock("../../contexts/ProfileContext.jsx", () => ({
  useProfileContext: () => ({
    isProfileSelf: isProfileSelfMock
  })
}));

// Mock API
vi.mock("../../api.js", () => ({
  default: {
    get: vi.fn()
  }
}));

// Import after mocks
import GroupEdit from "../../pages/GroupEdit";
import api from "../../api";

describe("GroupEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const groupData = {
    id: 99,
    name: "My Group",
    owner: { user: { id: 1 } }
  };

  test("shows loading initially and then form when authorized", async () => {
    api.get.mockResolvedValue({ data: groupData });
    isProfileSelfMock.mockReturnValue(true);

    render(<GroupEdit />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("form-group")).toBeInTheDocument();
    expect(screen.getByText("Editing My Group")).toBeInTheDocument();
  });

  test("shows unauthorized message if user is not the owner", async () => {
    api.get.mockResolvedValue({
      data: { ...groupData, owner: { user: { id: 2 } } }
    });
    isProfileSelfMock.mockReturnValue(false);

    render(<GroupEdit />);
    await waitFor(() =>
      expect(screen.getByTestId("unauthorized")).toBeInTheDocument()
    );
    expect(screen.getByText("Not allowed")).toBeInTheDocument();
  });

  test("shows error on API failure", async () => {
    api.get.mockRejectedValue(new Error("API error"));
    render(<GroupEdit />);
    await waitFor(() =>
      expect(screen.getByText("Failed to fetch group.")).toBeInTheDocument()
    );
  });
});
