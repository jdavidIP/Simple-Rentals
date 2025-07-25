// src/tests/ListingsView.test.jsx
import { describe, it, vi, beforeEach, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ListingsView from "../../pages/ListingsView.jsx";

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

vi.mock("../../api.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
import api from "../../api.js";

vi.mock("../../contexts/ProfileContext.jsx", () => ({
  useProfileContext: () => ({
    profile: { id: 5, yearly_income: 60000 },
    isProfileSelf: (id) => id === 5,
  }),
}));

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
    api.get.mockResolvedValue({ data: mockListing });
  });

  it("renders listing details after loading", async () => {
    render(
      <MemoryRouter initialEntries={["/listings/123"]}>
        <Routes>
          <Route path="/listings/:id" element={<ListingsView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading listing/i)).toBeInTheDocument();

    await screen.findByText(/Condo for Rent in Toronto/);
    expect(screen.getByText(/\$1200 \/ month/)).toBeInTheDocument();
    expect(screen.getByText(/Affordable|Recommended|Too Expensive/)).toBeInTheDocument();
    expect(screen.getByText(/Spacious condo/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /slide 1/i })).toBeInTheDocument();
  });

  it("navigates to conversations if user is owner", async () => {
    render(
      <MemoryRouter initialEntries={["/listings/123"]}>
        <Routes>
          <Route path="/listings/:id" element={<ListingsView />} />
        </Routes>
      </MemoryRouter>
    );

    const convoBtn = await screen.findByRole("button", { name: /See Conversations/i });
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

    const groupBtn = await screen.findByRole("button", { name: /See Groups/i });
    fireEvent.click(groupBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/listings/123/groups");
  });
});
