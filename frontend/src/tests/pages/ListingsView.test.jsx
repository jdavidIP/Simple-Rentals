import { describe, it, vi, beforeEach, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ListingsView from "../../pages/listing/ListingsView.jsx";

// Mock navigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "123" }),
    useNavigate: () => mockNavigate,
  };
});

// Mock ProfileContext 
vi.mock("../../contexts/ProfileContext.jsx", () => ({
  useProfileContext: () => ({
    profile: {
      id: 5,
      yearly_income: 60000,
      email: "testuser@email.com",
      phone_number: "555-1234",
    },
    isProfileSelf: (id) => id === 5,
    isFavourite: () => false,
    addToFavourites: vi.fn(),
    removeFromFavourites: vi.fn(),
  }),
}));

// Mock API
vi.mock("../../api.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
import api from "../../api.js";

describe("ListingsView Component", () => {
  const mockListing = {
    id: 123,
    property_type: "Condo",
    city: "Toronto",
    unit_number: "203",
    street_address: "45 King St",
    postal_code: "M4B 1B3",
    price: 1200,
    pictures: [
      { id: 1, is_primary: true, image: "image1.jpg" },
      { id: 2, is_primary: false, image: "image2.jpg" },
    ],
    description: "Spacious condo in the city center.",
    extra_amenities: "Gym, Pool",
    bedrooms: 2,
    bathrooms: 1,
    sqft_area: 900,
    parking_spaces: 1,
    ac: true,
    heating: true,
    laundry_type: "In-unit",
    pet_friendly: true,
    shareable: true,
    payment_type: "Monthly",
    verification_status: "Verified",
    move_in_date: "2025-09-01",
    utilities_cost: 100,
    utilities_payable_by_tenant: true,
    property_taxes: 50,
    property_taxes_payable_by_tenant: false,
    condo_fee: 70,
    condo_fee_payable_by_tenant: true,
    hoa_fee: 0,
    hoa_fee_payable_by_tenant: false,
    security_deposit: 500,
    security_deposit_payable_by_tenant: true,
    owner: {
      id: 5,
      first_name: "John",
      last_name: "Doe",
      profile_picture: "profile.jpg",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/listings/")) {
        return Promise.resolve({ data: mockListing });
      }
      if (typeof url === "string" && url.includes("/profile/reviews")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });
    api.post.mockResolvedValue({ data: { id: 77 } }); // mock conversation start
  });

  it("renders listing details after loading", async () => {
    render(
      <MemoryRouter initialEntries={["/listings/123"]}>
        <Routes>
          <Route path="/listings/:id" element={<ListingsView />} />
        </Routes>
      </MemoryRouter>
    );

    // Loader spinner is shown
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Wait for listing details to load
    await waitFor(() => {
      expect(screen.getByText(/Condo for Rent in Toronto/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/\$1200 \/ month/)).toBeInTheDocument();
    expect(screen.getByText(/Spacious condo/i)).toBeInTheDocument();
  });

  it("navigates to conversations if user is owner", async () => {
    render(
      <MemoryRouter initialEntries={["/listings/123"]}>
        <Routes>
          <Route path="/listings/:id" element={<ListingsView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Condo for Rent in Toronto/i)).toBeInTheDocument();
    });

    const convoBtn = screen.getByRole("button", { name: /See Conversations/i });
    fireEvent.click(convoBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/conversations");
  });

  it("navigates to groups page on 'See Groups' click", async () => {
    render(
      <MemoryRouter initialEntries={["/listings/123"]}>
        <Routes>
          <Route path="/listings/:id" element={<ListingsView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Condo for Rent in Toronto/i)).toBeInTheDocument();
    });

    const groupBtn = screen.getByRole("button", { name: /See Groups/i });
    fireEvent.click(groupBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/listings/123/groups");
  });
});
