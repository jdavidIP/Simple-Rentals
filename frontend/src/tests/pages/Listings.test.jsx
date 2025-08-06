import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Listings from "../../pages/listing/Listings";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

// Mock API
vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock ProfileContext with isFavourite
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: () => ({
    profile: {
      yearly_income: 60000,
      roommate_profile: 1,
    },
    isFavourite: () => false, // Fix for TypeError
  }),
}));

// Mock child components to simplify rendering
vi.mock("../../components/cards/ListingCard", () => ({
  default: ({ listing }) => <div>{listing.title}</div>,
}));
vi.mock("../../components/SortDropdown", () => ({
  default: ({ sortOption }) => <div>Sort: {sortOption}</div>,
}));
vi.mock("../../components/Pagination", () => ({
  default: () => <div>Pagination</div>,
}));

// Mock MultiSelectDropdown and Google Maps
vi.mock("../../components/MultiSelectDropdown", () => ({
  default: () => <div>MultiSelectDropdown</div>,
}));
vi.mock("../../hooks/useGoogleMaps", () => ({
  __esModule: true,
  default: () => ({
    googleMaps: null,
  }),
}));

import api from "../../api";

describe("Listings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn(); // prevent scroll error
  });

  it("renders loading state and then listings", async () => {
    const fakeListings = [
      { id: 1, title: "Listing 1", created_at: "2025-01-01", price: 1200, pictures: [{ is_primary: true }] },
      { id: 2, title: "Listing 2", created_at: "2025-01-02", price: 1500, pictures: [{ is_primary: true }] },
    ];

    api.get.mockResolvedValueOnce({ data: fakeListings });

    render(
      <MemoryRouter initialEntries={["/listings"]}>
        <Routes>
          <Route path="/listings" element={<Listings />} />
        </Routes>
      </MemoryRouter>
    );

    // Spinner present for loading state
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Wait for listings to appear
    await waitFor(() => {
      expect(screen.getByText("Listing 1")).toBeInTheDocument();
      expect(screen.getByText("Listing 2")).toBeInTheDocument();
    });
  });

  it("shows error message if fetch fails", async () => {
    api.get.mockRejectedValueOnce(new Error("Fetch failed"));

    render(
      <MemoryRouter initialEntries={["/listings"]}>
        <Routes>
          <Route path="/listings" element={<Listings />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch listings/i)).toBeInTheDocument();
    });
  });

  it("disables submit button if no location selected", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/listings",
            state: {
              listings: [],
              locationSelected: false,
              city: "",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/listings" element={<Listings />} />
        </Routes>
      </MemoryRouter>
    );

    const submitBtn = await screen.findByRole("button", {
      name: /Apply Filters/i,
    });

    expect(submitBtn).toBeDisabled();
  });
});
