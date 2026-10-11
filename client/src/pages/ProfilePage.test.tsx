import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import * as apiClientModule from '../lib/apiClient';
import * as authContextModule from '../context/AuthContext';

describe('ProfilePage', () => {
  const mockRefreshSession = vi.fn();
  const mockSignOut = vi.fn();

  const mockUser = {
    id: 'user-123',
    email: 'eco.champion@example.com',
    created_at: '2026-01-15T00:00:00Z',
    user_metadata: {
      full_name: 'Priya Sharma',
    },
    app_metadata: {},
    aud: 'authenticated',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      user: mockUser as any,
      session: { access_token: 'fake-jwt' } as any,
      isLoading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
      refreshSession: mockRefreshSession,
    });
  });

  it('renders user details, member date, and loads advisory statistics', async () => {
    vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path: string) => {
      if (path.includes('domain=')) {
        return { items: [], total: 2, page: 1, pageSize: 1, totalPages: 2 };
      }
      return { items: [], total: 8, page: 1, pageSize: 1, totalPages: 8 };
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('eco.champion@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Member since/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  it('handles profile name update successfully', async () => {
    const apiSpy = vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async () => {
      return { user: { id: 'user-123', fullName: 'Priya S.' } };
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'Priya S.' } });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith('/me', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: 'Priya S.' }),
      });
      expect(mockRefreshSession).toHaveBeenCalled();
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('shows sign out confirmation dialog and calls signOut on confirmation', async () => {
    vi.spyOn(apiClientModule, 'apiClient').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 1,
      totalPages: 0,
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Total Advisories Generated/i)).toBeInTheDocument();
    });

    const signOutInitialBtn = screen.getByRole('button', { name: /^sign out$/i });
    fireEvent.click(signOutInitialBtn);

    expect(screen.getByText(/are you sure you want to sign out\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /yes, sign out/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
