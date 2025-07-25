import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import ReviewCard from '../../components/ReviewCard';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock ProfileContext
vi.mock('../../contexts/ProfileContext', () => ({
  useProfileContext: () => ({
    isProfileSelf: (id) => id === 1,
  }),
}));

describe('ReviewCard Component', () => {
  const review = {
    id: 123,
    comment: 'This is a detailed review comment that should display normally.',
    rating: 4,
    reviewee_role_display: 'Roommate',
    reviewer: {
      id: 1,
      first_name: 'Jane',
      last_name: 'Doe',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reviewer name, initials, comment, and rating', () => {
    render(<ReviewCard review={review} />, { wrapper: MemoryRouter });

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText(/Rating: 4\/5/)).toBeInTheDocument();
    expect(screen.getByText(review.comment)).toBeInTheDocument();
    expect(screen.getByText(/Reviewed as: Roommate/)).toBeInTheDocument();
  });

  it('shows Edit Review button if reviewer is self', () => {
    render(<ReviewCard review={review} />, { wrapper: MemoryRouter });

    expect(screen.getByText('Edit Review')).toBeInTheDocument();
  });

  it('does not show Edit button if reviewer is someone else', () => {
    const otherReview = { ...review, reviewer: { ...review.reviewer, id: 999 } };

    render(<ReviewCard review={otherReview} />, { wrapper: MemoryRouter });

    expect(screen.queryByText('Edit Review')).not.toBeInTheDocument();
  });

  it('navigates to edit page when Edit Review button is clicked', () => {
    render(<ReviewCard review={review} />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Edit Review'));

    expect(navigateMock).toHaveBeenCalledWith('/reviews/edit/123');
  });

  it('shows "Anonymous" and fallback initials if no reviewer info', () => {
    const anonymousReview = { ...review, reviewer: null };

    render(<ReviewCard review={anonymousReview} />, { wrapper: MemoryRouter });

    expect(screen.getByText('Anonymous')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
