import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Applications from "../../pages/Applications";
import api from "../../api";

// Mock GroupCard component
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

    render(<Applications />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    expect(screen.getByText("Applications Management")).toBeInTheDocument();
    expect(screen.getByText("Landlord Group 1")).toBeInTheDocument();
    expect(screen.getByText("Landlord Group 2")).toBeInTheDocument();
  });

  test("switches to member tab and shows member applications", async () => {
    api.get.mockResolvedValue({ data: mockApplications });

    render(<Applications />);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("As Member"));

    expect(screen.getByText("Group Management")).toBeInTheDocument();
    expect(screen.getByText("Member Group 1")).toBeInTheDocument();
    expect(screen.getByText("Member Group 2")).toBeInTheDocument();
  });

  test("shows error message on API failure", async () => {
    api.get.mockRejectedValue(new Error("API failed"));

    render(<Applications />);

    await waitFor(() =>
      expect(
        screen.getByText("Failed to fetch applications.")
      ).toBeInTheDocument()
    );
  });

  test("shows empty messages when no applications", async () => {
    api.get.mockResolvedValue({ data: { landlord: [], member: [] } });

    render(<Applications />);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    expect(screen.getByText("No sent applications.")).toBeInTheDocument();
    expect(screen.getByText("No applications under review.")).toBeInTheDocument();
    expect(screen.getByText("No invited applications.")).toBeInTheDocument();

    fireEvent.click(screen.getByText("As Member"));

    expect(screen.getByText("No rejected applications.")).toBeInTheDocument();
    expect(screen.getByText("No private groups.")).toBeInTheDocument();
  });
});
