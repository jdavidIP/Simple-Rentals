import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import ListingCard from '../../components/ListingCard';
import { MemoryRouter } from 'react-router-dom';

// 🔧 Mock useNavigate
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// 🔧 Mock API
vi.mock('../../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// 🔧 Mock ProfileContext
vi.mock('../../contexts/ProfileContext', () => ({
  useProfileContext: () => ({
    profile: { id: 1 },
    isProfileSelf: (id) => id === 1,
  }),
}));

import api from '../../api';

describe('ListingCard Component', () => {
  const baseListing = {
    id: 101,
    price: 1500,
    bedrooms: 2,
    property_type: 'apartment',
    city: 'Toronto',
    move_in_date: '2025-08-01',
    primary_image: {
      image: 'https://example.com/image.jpg',
    },
    owner: { id: 1 }, // Same as profile.id
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders listing details correctly', () => {
    render(<ListingCard listing={baseListing} income={60000} />, { wrapper: MemoryRouter });

    expect(screen.getByText(/2 bedroom apartment/i)).toBeInTheDocument();
    expect(screen.getByText(/Toronto/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,500/)).toBeInTheDocument();
    expect(screen.getByText(/Move-in:/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', baseListing.primary_image.image);
  });

  test('shows affordability tag based on income', () => {
    render(<ListingCard listing={baseListing} income={60000} />, { wrapper: MemoryRouter });
    expect(screen.getByText('✅ Recommended')).toBeInTheDocument();
  });

  test('shows edit button if user owns listing', () => {
    render(<ListingCard listing={baseListing} income={60000} />, { wrapper: MemoryRouter });
    expect(screen.getByText(/Edit Listing/i)).toBeInTheDocument();
  });

  test('shows contact owner if user does not own listing', () => {
    const listing = { ...baseListing, owner: { id: 999 } };
    render(<ListingCard listing={listing} income={60000} />, { wrapper: MemoryRouter });
    expect(screen.getByText(/Contact Owner/i)).toBeInTheDocument();
  });

  test('navigates to detail page on View Details click', () => {
    render(<ListingCard listing={baseListing} income={60000} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByText('View Details'));
    expect(navigateMock).toHaveBeenCalledWith('/listings/101');
  });

  test('navigates to edit page on Edit Listing click', () => {
    render(<ListingCard listing={baseListing} income={60000} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByText('Edit Listing'));
    expect(navigateMock).toHaveBeenCalledWith('/listings/edit/101');
  });

  test('starts new conversation if none exists', async () => {
    const listing = { ...baseListing, owner: { id: 2 } };
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({ data: { id: 999 } });

    render(<ListingCard listing={listing} income={60000} />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Contact Owner'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/conversations/');
      expect(api.post).toHaveBeenCalledWith('/listing/101/start_conversation', {});
      expect(navigateMock).toHaveBeenCalledWith('/conversations/999');
    });
  });

  test('navigates to existing conversation if match found', async () => {
    const listing = { ...baseListing, owner: { id: 2 } };
    api.get.mockResolvedValue({
      data: [
        {
          id: 888,
          listing: { id: 101 },
          participants: [1, 2],
        },
      ],
    });

    render(<ListingCard listing={listing} income={60000} />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Contact Owner'));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/conversations/888');
    });
  });

  test('shows no tag if income is missing', () => {
    render(<ListingCard listing={baseListing} income={null} />, { wrapper: MemoryRouter });
    expect(screen.queryByText(/Affordable|Too Expensive|Recommended/)).not.toBeInTheDocument();
  });
});
