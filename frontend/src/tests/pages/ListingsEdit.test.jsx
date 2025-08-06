import { render, screen, waitFor } from "@testing-library/react";
import ListingsEdit from "../../pages/listing/ListingsEdit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

// Mock API
vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock ProfileContext
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: () => ({
    isProfileSelf: vi.fn((id) => id === 5), // authorized only if owner.id === 5
  }),
}));

// Mock FormListing
vi.mock("../../components/forms/FormListing", () => ({
  default: ({ listing }) => <div>FormListing for {listing.title}</div>,
}));

// Mock Unauthorized
vi.mock("../../pages/util/Unauthorized", () => ({
  default: () => <div>Unauthorized Access</div>,
}));

import api from "../../api";

describe("ListingsEdit Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", async () => {
    api.get.mockResolvedValueOnce({
      data: { id: 1, title: "Test Listing", owner: { id: 5 } },
    });

    render(
      <MemoryRouter initialEntries={["/listings/edit/1"]}>
        <Routes>
          <Route path="/listings/edit/:id" element={<ListingsEdit />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/FormListing for Test Listing/i)).toBeInTheDocument();
    });
  });

  it("shows error if fetch fails", async () => {
    api.get.mockRejectedValueOnce(new Error("Fetch error"));

    render(
      <MemoryRouter initialEntries={["/listings/edit/1"]}>
        <Routes>
          <Route path="/listings/edit/:id" element={<ListingsEdit />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch listing/i)).toBeInTheDocument();
    });
  });

  it("shows unauthorized if user is not the owner", async () => {
    api.get.mockResolvedValueOnce({
      data: { id: 1, title: "Test Listing", owner: { id: 99 } }, // not the current user
    });

    render(
      <MemoryRouter initialEntries={["/listings/edit/1"]}>
        <Routes>
          <Route path="/listings/edit/:id" element={<ListingsEdit />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Unauthorized Access/i)).toBeInTheDocument();
    });
  });

  it("renders the edit form when authorized", async () => {
    api.get.mockResolvedValueOnce({
      data: { id: 1, title: "Authorized Listing", owner: { id: 5 } },
    });

    render(
      <MemoryRouter initialEntries={["/listings/edit/1"]}>
        <Routes>
          <Route path="/listings/edit/:id" element={<ListingsEdit />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/FormListing for Authorized Listing/i)).toBeInTheDocument();
    });
  });
});
