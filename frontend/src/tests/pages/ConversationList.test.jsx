import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import ConversationList from "../../pages/ConversationList";
import api from "../../api";

// Mock ConversationCard
vi.mock("../../components/ConversationCard", () => ({
  default: ({ conv }) => <li data-testid="conversation-card">{conv.title}</li>
}));

// Mock API
vi.mock("../../api", () => ({
  default: {
    get: vi.fn()
  }
}));

describe("ConversationList Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("displays loading then conversations", async () => {
    api.get.mockResolvedValue({
      data: [
        { id: 1, title: "Conversation A" },
        { id: 2, title: "Conversation B" }
      ]
    });

    render(<ConversationList />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    expect(screen.getByText("Your Conversations")).toBeInTheDocument();
    expect(screen.getByText("Conversation A")).toBeInTheDocument();
    expect(screen.getByText("Conversation B")).toBeInTheDocument();
  });

  test("displays empty message if no conversations", async () => {
    api.get.mockResolvedValue({ data: [] });

    render(<ConversationList />);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    expect(screen.getByText("No conversations found.")).toBeInTheDocument();
  });

  test("displays error on API failure", async () => {
    api.get.mockRejectedValue(new Error("API error"));

    render(<ConversationList />);

    await waitFor(() =>
      expect(
        screen.getByText("Failed to fetch conversations.")
      ).toBeInTheDocument()
    );
  });
});
