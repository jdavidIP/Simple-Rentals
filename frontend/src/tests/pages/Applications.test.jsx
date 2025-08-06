import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Applications from "../../pages/group/Applications";
import api from "../../api";
import { MemoryRouter } from "react-router-dom";

// Mock GroupCard to a simple display component
vi.mock("../../components/GroupCard", () => ({
  default: ({ group }) => <div data-testid="group-card">{group.name}</div>
}));

// Mock the API
vi.mock("../../api", () => ({
  default: {
    get: vi.fn()
  }
}));

const mockApplications = {
  landlord: [
    { id: 1, name: "Landlord Group 1", group_status: "S" },
    { id: 2, name: "Landlord Group 2", group_status: "U" }
  ],
  member: [
    { id: 3, name: "Member Group 1", group_status: "I" },
    { id: 4, name: "Member Group 2", group_status: "R" }
  ]
};

describe("Applications Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows loading then landlord applications", async () => {
    api.get.mockResolvedValue({ data: mockApplications });

    render(
      <MemoryRouter>
        <Applications />
      </MemoryRouter>
    );

    // Look for the spinner by role
    expect(screen.getByRole("status")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument()
    );

    expect(screen.getByText(/Applications Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Landlord Group 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Landlord Group 2/i)).toBeInTheDocument();
  });

  test("switches to member tab and shows member applications", async () => {
    api.get.mockResolvedValue({ data: mockApplications });

    render(
      <MemoryRouter>
        <Applications />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument()
    );

    const memberTab = screen.getByRole("tab", { name: /as member/i });
    fireEvent.click(memberTab);

    expect(screen.getByText(/Member Group 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Member Group 2/i)).toBeInTheDocument();
  });

  test("shows error message on API failure", async () => {
    api.get.mockRejectedValue(new Error("API failed"));

    render(
      <MemoryRouter>
        <Applications />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Failed to fetch applications/i)
      ).toBeInTheDocument()
    );
  });

  test("shows empty messages when no applications", async () => {
    api.get.mockResolvedValue({ data: { landlord: [], member: [] } });

    render(
      <MemoryRouter>
        <Applications />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument()
    );

    expect(screen.getByText(/No items in.*Sent/i)).toBeInTheDocument();
    expect(screen.getByText(/No items in.*Under Review/i)).toBeInTheDocument();
    expect(screen.getByText(/No items in.*Invited/i)).toBeInTheDocument();

    // Switch to member tab for member empty states
    const memberTab = screen.getByRole("tab", { name: /as member/i });
    fireEvent.click(memberTab);

    expect(screen.getByText(/No items in.*Open/i)).toBeInTheDocument();
    expect(screen.getByText(/No items in.*Private/i)).toBeInTheDocument();
    expect(screen.getByText(/No items in.*Filled/i)).toBeInTheDocument();
    expect(screen.getByText(/No items in.*Sent/i)).toBeInTheDocument();
    expect(screen.getByText(/No items in.*Under Review/i)).toBeInTheDocument();
    expect(screen.getByText(/No items in.*Rejected/i)).toBeInTheDocument();
    expect(screen.getByText(/No items in.*Invited/i)).toBeInTheDocument();
  });
});
