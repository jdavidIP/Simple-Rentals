import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RoommatesView from "../../pages/RoommatesView";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock API
vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock ProfileContext
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: () => ({
    profile: {
      id: 1,
    },
    isRoommateSelf: () => true,
    profileLoading: false,
  }),
}));

// Mock useParams and useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
    useNavigate: () => vi.fn(),
  };
});

import api from "../../api";

describe("RoommatesView Page", () => {
  const mockRoommate = {
    id: 1,
    user: {
      id: 1,
      first_name: "Alice",
      last_name: "Smith",
      profile_picture: "",
      preferred_location: "Toronto",
      sex: "F",
    },
    description: "Looking for a roommate downtown",
    move_in_date: "2025-09-01",
    stay_length: 12,
    occupation: "Student",
    roommate_budget: 900,
    smoke_friendly: true,
    cannabis_friendly: false,
    pet_friendly: true,
    couple_friendly: false,
    gender_preference: "M",
    open_to_message: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", async () => {
    api.get.mockResolvedValueOnce({ data: mockRoommate });

    render(
      <MemoryRouter initialEntries={["/roommates/1"]}>
        <Routes>
          <Route path="/roommates/:id" element={<RoommatesView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });

  it("renders roommate details after successful fetch", async () => {
    api.get.mockResolvedValueOnce({ data: mockRoommate });

    render(
      <MemoryRouter initialEntries={["/roommates/1"]}>
        <Routes>
          <Route path="/roommates/:id" element={<RoommatesView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());
    expect(screen.getByText(/Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Looking for a roommate downtown/i)).toBeInTheDocument();
    expect(screen.getByText(/Preferred Area:/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget:/i)).toBeInTheDocument();
    expect(screen.getByText(/Move-in Date:/i)).toBeInTheDocument();
  });

  it("shows error message if fetch fails", async () => {
    api.get.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter initialEntries={["/roommates/1"]}>
        <Routes>
          <Route path="/roommates/:id" element={<RoommatesView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/failed to fetch profile/i)).toBeInTheDocument());
  });
});
