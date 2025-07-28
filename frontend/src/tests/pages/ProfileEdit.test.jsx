import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProfileEdit from "../../pages/ProfileEdit";
import api from "../../api";
import { useProfileContext } from "../../contexts/ProfileContext";
import { vi } from "vitest";

// Mocks
vi.mock("../../api");
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: vi.fn(),
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "3" }),
  };
});
vi.mock("../../components/FormEdit.jsx", () => ({
  default: () => <div>Mocked FormEdit</div>,
}));
vi.mock("../../pages/Unauthorized.jsx", () => ({
  default: () => <div>Mocked Unauthorized</div>,
}));

describe("ProfileEdit Page", () => {
  const mockProfile = {
    id: 3,
    first_name: "Alice",
    email: "alice@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading initially", () => {
    useProfileContext.mockReturnValue({
      isProfileSelf: () => true,
    });

    render(<ProfileEdit />, { wrapper: MemoryRouter });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders FormRegister when profile is loaded and authorized", async () => {
    api.get.mockResolvedValueOnce({ data: mockProfile });
    useProfileContext.mockReturnValue({
      isProfileSelf: (id) => id === 3,
    });

    render(<ProfileEdit />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText("Mocked FormRegister")).toBeInTheDocument();
    });
  });

  it("shows Unauthorized if not self profile", async () => {
    api.get.mockResolvedValueOnce({ data: mockProfile });
    useProfileContext.mockReturnValue({
      isProfileSelf: () => false,
    });

    render(<ProfileEdit />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText("Mocked Unauthorized")).toBeInTheDocument();
    });
  });

  it("shows error if fetch fails", async () => {
    api.get.mockRejectedValueOnce(new Error("Fetch error"));
    useProfileContext.mockReturnValue({
      isProfileSelf: () => false,
    });

    render(<ProfileEdit />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch profile/i)).toBeInTheDocument();
    });
  });
});
