import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ListingsHome from "../../pages/listing/ListingsHome";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import api from "../../api";

// --- MOCKS ---
vi.mock("../../contexts/ProfileContext.jsx", () => ({
  useProfileContext: () => ({ profile: null, setProfile: vi.fn() }),
  ProfileProvider: ({ children }) => children,
}));

vi.mock("../../hooks/useGoogleMaps", () => ({
  __esModule: true,
  default: () => ({ loading: false, error: null }),
}));

// Mock modules
vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

beforeEach(() => {
  vi.resetAllMocks();

  const mockAutocompleteInstance = {
    addListener: vi.fn((event, cb) => {
      if (event === "place_changed") {
        window.__placeChangedCallback__ = cb;
      }
    }),
    getPlace: () => ({
      formatted_address: "Waterloo, ON",
      geometry: {
        location: {
          lat: () => 43.4643,
          lng: () => -80.5204,
        },
      },
    }),
  };

  global.google = {
    maps: {
      places: {
        Autocomplete: vi.fn(() => mockAutocompleteInstance),
      },
    },
  };
});

describe("ListingsHome Page", () => {
  it("renders form elements", () => {
    render(
      <MemoryRouter>
        <ListingsHome />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Enter a city/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Search Listings/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // radius select
  });

  it("disables submit button if city is typed but not selected", () => {
    render(
      <MemoryRouter>
        <ListingsHome />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Enter a city/i), {
      target: { value: "Toronto" },
    });

    expect(screen.getByRole("button", { name: /Search Listings/i })).toBeDisabled();
  });

  it("shows warning if city is not selected from dropdown", () => {
    render(
      <MemoryRouter>
        <ListingsHome />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Enter a city/i), {
      target: { value: "Toronto" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Search Listings/i }));

    expect(screen.getByText(/Please select a city from the dropdown/i)).toBeInTheDocument();
  });

  it("calls API and navigates on valid submit", async () => {
    const listings = [{ id: 1, title: "Test Listing" }];
    api.get.mockResolvedValueOnce({ data: listings });

    render(
      <MemoryRouter>
        <ListingsHome />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/Enter a city/i);
    fireEvent.change(input, { target: { value: "Waterloo" } });

    // Simulate selecting from dropdown
    await waitFor(() => window.__placeChangedCallback__?.());

    fireEvent.click(screen.getByRole("button", { name: /Search Listings/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/listings/viewAll", expect.any(Object));
    });
  });

  it("shows error if API fails", async () => {
    api.get.mockRejectedValueOnce(new Error("API Error"));

    render(
      <MemoryRouter>
        <ListingsHome />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Enter a city/i), {
      target: { value: "Waterloo" },
    });

    await waitFor(() => window.__placeChangedCallback__?.());

    fireEvent.click(screen.getByRole("button", { name: /Search Listings/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch listings/i)).toBeInTheDocument();
    });
  });
});
