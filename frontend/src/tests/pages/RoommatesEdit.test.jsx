import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import RoommatesEdit from "../../pages/RoommatesEdit";
import api from "../../api";
import { useProfileContext } from "../../contexts/ProfileContext";

// Mocks
vi.mock("../../api");
vi.mock("../../components/FormRoommate", () => ({
  default: () => <div>Mocked FormRoommate</div>,
}));
vi.mock("../../pages/Unauthorized.jsx", () => ({
  default: () => <div>Mocked Unauthorized</div>,
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "42" }),
  };
});
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: vi.fn(),
}));

describe("RoommatesEdit Page", () => {
  const mockRoommate = {
    id: 42,
    name: "Test Roommate",
    age: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading initially", () => {
    useProfileContext.mockReturnValue({
      isRoommateSelf: () => true,
      profileLoading: true,
    });

    render(<RoommatesEdit />, { wrapper: MemoryRouter });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders FormRoommate when roommate is loaded and authorized", async () => {
    api.get.mockResolvedValueOnce({ data: mockRoommate });
    useProfileContext.mockReturnValue({
      isRoommateSelf: (id) => id === 42,
      profileLoading: false,
    });

    render(<RoommatesEdit />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText("Mocked FormRoommate")).toBeInTheDocument();
    });
  });

  it("shows Unauthorized if not roommate self", async () => {
    api.get.mockResolvedValueOnce({ data: mockRoommate });
    useProfileContext.mockReturnValue({
      isRoommateSelf: () => false,
      profileLoading: false,
    });

    render(<RoommatesEdit />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText("Mocked Unauthorized")).toBeInTheDocument();
    });
  });

  it("shows error if fetch fails", async () => {
    api.get.mockRejectedValueOnce(new Error("Fetch error"));
    useProfileContext.mockReturnValue({
      isRoommateSelf: () => false,
      profileLoading: false,
    });

    render(<RoommatesEdit />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch roommate/i)).toBeInTheDocument();
    });
  });
});
