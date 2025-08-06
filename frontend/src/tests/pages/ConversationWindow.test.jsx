import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ConversationWindow from "../../pages/conversation/ConversationWindow";
import api from "../../api";

// Mock ListingCard to avoid prop errors
vi.mock("../../components/cards/ListingCard", () => ({
  default: () => <div data-testid="listing-card" />
}));

// Mock router (useParams, useNavigate)
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ conversationId: "123" }),
    useNavigate: () => vi.fn(),
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
    // Patch scrollIntoView to avoid jsdom error
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  // Updated listing mock with all required fields
  const mockConversation = {
    id: 123,
    listing: {
      id: 77,
      street_address: "123 Test St",
      price: 1200,
      bedrooms: 2,
      bathrooms: 1,
      pictures: [
        { id: 1, is_primary: true, url: "/pic.jpg" }
      ],
    },
    participants: [
      { id: 1, full_name: "You" },
      { id: 2, full_name: "Them" }
    ],
    messages: [
      {
        id: 1,
        sender: { id: 1, first_name: "You", last_name: "Self" },
        content: "Hello!",
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        sender: { id: 2, first_name: "Them", last_name: "Else" },
        content: "Hi!",
        timestamp: new Date().toISOString()
      }
    ]
  };

  test("renders loading then conversation content", async () => {
    api.get.mockResolvedValue({ data: mockConversation });

    render(<ConversationWindow />);

    // Check for spinner
    expect(screen.getByRole("status")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Them")).toBeInTheDocument();
    expect(screen.getByText("123 Test St")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("Hi!")).toBeInTheDocument();
    expect(screen.getByTestId("listing-card")).toBeInTheDocument();
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
        sender: { id: 1, first_name: "You", last_name: "Self" },
        content: "Test message",
        timestamp: new Date().toISOString()
      }
    });

    render(<ConversationWindow />);

    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument()
    );

    fireEvent.change(screen.getByPlaceholderText("Type your message..."), {
      target: { value: "Test message" }
    });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(screen.getByText("Test message")).toBeInTheDocument()
    );
  });
});
