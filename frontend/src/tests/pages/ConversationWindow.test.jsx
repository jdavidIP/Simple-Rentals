import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ConversationWindow from "../../pages/ConversationWindow";
import api from "../../api";
import * as router from "react-router-dom";
import * as profileContext from "../../contexts/ProfileContext";

// Mock router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ conversationId: "123" })
  };
});

// Mock profile context
vi.mock("../../contexts/ProfileContext", () => ({
  useProfileContext: () => ({
    isProfileSelf: (id) => id === 1
  })
}));

// Mock API
vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe("ConversationWindow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockConversation = {
    id: 123,
    listing: { street_address: "123 Test St" },
    messages: [
      {
        id: 1,
        sender: { id: 1, first_name: "You" },
        content: "Hello!",
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        sender: { id: 2, first_name: "Them" },
        content: "Hi!",
        timestamp: new Date().toISOString()
      }
    ]
  };

  test("renders loading then conversation content", async () => {
    api.get.mockResolvedValue({ data: mockConversation });

    render(<ConversationWindow />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Conversation")).toBeInTheDocument();
    expect(screen.getByText("123 Test St")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("Hi!")).toBeInTheDocument();
  });

  test("shows error if fetch fails", async () => {
    api.get.mockRejectedValue(new Error("API Error"));

    render(<ConversationWindow />);

    await waitFor(() =>
      expect(
        screen.getByText("Failed to fetch conversation.")
      ).toBeInTheDocument()
    );
  });

  test("sends a message successfully", async () => {
    api.get.mockResolvedValue({ data: mockConversation });
    api.post.mockResolvedValue({
      data: {
        id: 3,
        sender: { id: 1, first_name: "You" },
        content: "Test message",
        timestamp: new Date().toISOString()
      }
    });

    render(<ConversationWindow />);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    fireEvent.change(screen.getByPlaceholderText("Type your message..."), {
      target: { value: "Test message" }
    });

    fireEvent.click(screen.getByText("Send"));

    await waitFor(() =>
      expect(screen.getByText("Test message")).toBeInTheDocument()
    );
  });
});
