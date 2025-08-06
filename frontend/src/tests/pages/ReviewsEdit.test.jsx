import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReviewsEdit from "../../pages/review/ReviewsEdit";
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
    useParams: () => ({ id: "5" }),
  };
});
vi.mock("../../components/forms/FormReview", () => ({
  default: () => <div>Mocked FormReview</div>,
}));
vi.mock("../../pages/util/Unauthorized", () => ({
  default: () => <div>Mocked Unauthorized</div>,
}));

describe("ReviewsEdit Page", () => {
  const mockReview = {
    id: 5,
    rating: 4,
    comment: "Nice person",
    reviewer: { id: 3 },
    reviewee: { id: 4 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading initially", () => {
    useProfileContext.mockReturnValue({
      isProfileSelf: () => true,
    });

    render(<ReviewsEdit />, { wrapper: MemoryRouter });
    // Look for the loading spinner by role
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders FormReview when review is loaded and authorized", async () => {
    api.get.mockResolvedValueOnce({ data: mockReview });
    useProfileContext.mockReturnValue({
      isProfileSelf: (id) => id === 3,
    });

    render(<ReviewsEdit />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText("Mocked FormReview")).toBeInTheDocument();
    });
  });

  it("shows Unauthorized if not self reviewer", async () => {
    api.get.mockResolvedValueOnce({ data: mockReview });
    useProfileContext.mockReturnValue({
      isProfileSelf: () => false,
    });

    render(<ReviewsEdit />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText("Mocked Unauthorized")).toBeInTheDocument();
    });
  });

  it("shows error if fetch fails", async () => {
    api.get.mockRejectedValueOnce(new Error("Fetch error"));
    useProfileContext.mockReturnValue({
      isProfileSelf: () => false,
    });

    render(<ReviewsEdit />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch review/i)).toBeInTheDocument();
    });
  });
});
