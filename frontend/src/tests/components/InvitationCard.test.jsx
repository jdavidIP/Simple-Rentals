import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import InvitationCard from '../../components/InvitationCard';

// Mock API
vi.mock('../../api', () => ({
  default: {
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock ProfileContext
vi.mock('../../contexts/ProfileContext', () => ({
  useProfileContext: () => ({
    profile: {
      roommate_profile: 42,
    },
  }),
}));

import api from '../../api';

describe('InvitationCard Component', () => {
  const baseInvitation = {
    id: 1,
    group: 101,
    group_name: 'Test Group',
    invited_user: 42,
    invited_by_email: 'sender@example.com',
    invited_user_email: 'receiver@example.com',
    created_at: new Date().toISOString(),
    accepted: null,
  };

  let onChangeMock;

  beforeEach(() => {
    vi.clearAllMocks();
    onChangeMock = vi.fn();
  });

  test('renders invitation details', () => {
    render(<InvitationCard invitation={baseInvitation} onChange={onChangeMock} />);
    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByText(/sender@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/receiver@example.com/)).toBeInTheDocument();
  });

  test('shows Accept/Reject buttons if invitation is received and pending', () => {
    render(<InvitationCard invitation={baseInvitation} onChange={onChangeMock} />);
    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  test('calls API and updates status when accepted', async () => {
    api.patch.mockResolvedValue({});
    render(<InvitationCard invitation={baseInvitation} onChange={onChangeMock} />);
    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/groups/invitations/1/update', { accepted: true });
      expect(api.patch).toHaveBeenCalledWith('/groups/101/join');
      expect(onChangeMock).toHaveBeenCalled();
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });
  });

  test('calls API and updates status when rejected', async () => {
    api.patch.mockResolvedValue({});
    render(<InvitationCard invitation={baseInvitation} onChange={onChangeMock} />);
    fireEvent.click(screen.getByText('Reject'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/groups/invitations/1/update', { accepted: false });
      expect(api.patch).toHaveBeenCalledWith('/groups/101/join');
      expect(onChangeMock).toHaveBeenCalled();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });

  test('shows delete button and deletes if not received', async () => {
    const notReceived = { ...baseInvitation, invited_user: 999, accepted: true };
    api.delete.mockResolvedValue({});
    render(<InvitationCard invitation={notReceived} onChange={onChangeMock} />);
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/groups/invitations/1/delete');
      expect(onChangeMock).toHaveBeenCalled();
    });
  });

  test('shows error if delete fails', async () => {
    const notReceived = { ...baseInvitation, invited_user: 999, accepted: true };
    api.delete.mockRejectedValue(new Error('fail'));
    render(<InvitationCard invitation={notReceived} onChange={onChangeMock} />);
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText('Failed to delete invitation.')).toBeInTheDocument();
    });
  });
});
