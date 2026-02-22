import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

function TestConsumer() {
  const { user, loading, authEnabled, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="auth-enabled">{String(authEnabled)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <span data-testid="tier">{user ? user.tier : 'none'}</span>
      <button onClick={logout}>logout</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAuth without provider', () => {
  it('returns safe defaults', () => {
    render(<TestConsumer />);
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('auth-enabled')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });
});

describe('AuthProvider', () => {
  it('shows loading initially then resolves', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('disables auth when /api/auth/me returns 404 (self-hosted)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('auth-enabled')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('enables auth and sets user when /api/auth/me returns user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        email: 'test@example.com',
        tier: 'paid',
        usage: { used: 3, limit: 50, date: '2026-02-21' },
      }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('auth-enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('tier')).toHaveTextContent('paid');
  });

  it('enables auth but no user when /api/auth/me returns 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('auth-enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('disables auth on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('auth-enabled')).toHaveTextContent('false');
  });
});
