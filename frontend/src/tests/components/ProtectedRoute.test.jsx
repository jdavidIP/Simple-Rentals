import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { MemoryRouter } from 'react-router-dom';

// 🧪 Mocks
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

vi.mock('../../api', () => ({
  default: {
    post: vi.fn(),
  },
}));

// ⏹ Mock child component
const MockChild = () => <div>Protected Content</div>;

import api from '../../api';
import { jwtDecode } from 'jwt-decode';

describe('ProtectedRoute Component', () => {
  const validToken = 'valid.token.value';
  const expiredToken = 'expired.token.value';

  const setup = () =>
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <MockChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects to login if no access token is present', async () => {
    setup();
    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
  });

  it('renders children if token is valid and not expired', async () => {
    const now = Math.floor(Date.now() / 1000) + 60 * 60; // +1h
    localStorage.setItem('access', validToken);
    jwtDecode.mockReturnValue({ exp: now });

    setup();
    await screen.findByText('Protected Content');
  });

  it('refreshes token if expired and refresh succeeds', async () => {
    const expired = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem('access', expiredToken);
    localStorage.setItem('refresh', 'valid.refresh.token');
    jwtDecode.mockReturnValue({ exp: expired });

    api.post.mockResolvedValue({
      status: 200,
      data: { access: 'newAccessToken' },
    });

    setup();
    await screen.findByText('Protected Content');

    expect(api.post).toHaveBeenCalledWith('/api/token/refresh/', {
      refresh: 'valid.refresh.token',
    });
    expect(localStorage.getItem('access')).toBe('newAccessToken');
  });

  it('redirects to login if refresh fails', async () => {
    const expired = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem('access', expiredToken);
    localStorage.setItem('refresh', 'expired.refresh.token');
    jwtDecode.mockReturnValue({ exp: expired });

    api.post.mockRejectedValue(new Error('Token refresh failed'));

    setup();

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});
