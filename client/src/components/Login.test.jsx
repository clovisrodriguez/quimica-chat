import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Login', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByText('STEM Laboratory')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument();
    expect(screen.getByText('Acceder con enlace mágico')).toBeInTheDocument();
  });

  it('disables submit when email is empty', () => {
    render(<Login />);
    expect(screen.getByText('Acceder con enlace mágico')).toBeDisabled();
  });

  it('enables submit when email is entered', () => {
    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@example.com' } });
    expect(screen.getByText('Acceder con enlace mágico')).not.toBeDisabled();
  });

  it('shows sent state after successful send', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Acceder con enlace mágico'));

    await waitFor(() => {
      expect(screen.getByText('Revisa tu correo')).toBeInTheDocument();
    });
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('sends correct request to /api/auth/send-link', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Acceder con enlace mágico'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });
  });

  it('shows error on failed send', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Error de prueba' }),
    });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Acceder con enlace mágico'));

    await waitFor(() => {
      expect(screen.getByText('Error de prueba')).toBeInTheDocument();
    });
  });

  it('shows generic error on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Acceder con enlace mágico'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('allows switching to different email from sent state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Acceder con enlace mágico'));

    await waitFor(() => {
      expect(screen.getByText('Revisa tu correo')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Usar otro correo'));
    expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument();
  });

  it('shows loading state while sending', async () => {
    let resolvePromise;
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      new Promise((resolve) => { resolvePromise = resolve; })
    );

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Acceder con enlace mágico'));

    expect(screen.getByText('Enviando...')).toBeInTheDocument();

    resolvePromise({ ok: true, json: () => Promise.resolve({ ok: true }) });

    await waitFor(() => {
      expect(screen.getByText('Revisa tu correo')).toBeInTheDocument();
    });
  });
});
