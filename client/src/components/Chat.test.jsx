import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Chat from './Chat';

// Mock react-markdown to avoid ESM issues in test
vi.mock('react-markdown', () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));

function createMockStreamResponse(chunks) {
  let index = 0;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
  return {
    ok: true,
    body: stream,
  };
}

describe('Chat', () => {
  const defaultProps = {
    injectedInput: null,
    onInputConsumed: vi.fn(),
    onDrawMolecule: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders chat header', () => {
    render(<Chat {...defaultProps} />);
    expect(screen.getByText('Chat con IA')).toBeInTheDocument();
  });

  it('shows empty state with suggestion buttons', () => {
    render(<Chat {...defaultProps} />);
    expect(screen.getByText('¿Que es un grupo funcional?')).toBeInTheDocument();
    expect(screen.getByText('¿Diferencia entre aldehido y cetona?')).toBeInTheDocument();
    expect(screen.getByText('Explica la esterificacion')).toBeInTheDocument();
  });

  it('does not show reset button when no messages', () => {
    render(<Chat {...defaultProps} />);
    expect(screen.queryByText('Nueva conversación')).not.toBeInTheDocument();
  });

  it('renders input field and submit button', () => {
    render(<Chat {...defaultProps} />);
    expect(screen.getByPlaceholderText('Escribe tu pregunta...')).toBeInTheDocument();
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<Chat {...defaultProps} />);
    const button = screen.getByText('Enviar');
    expect(button).toBeDisabled();
  });

  it('enables send button when input has text', () => {
    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'test question' } });
    const button = screen.getByText('Enviar');
    expect(button).not.toBeDisabled();
  });

  it('sets input when suggestion button is clicked', () => {
    render(<Chat {...defaultProps} />);
    fireEvent.click(screen.getByText('¿Que es un grupo funcional?'));
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    expect(input.value).toBe('¿Que es un grupo funcional?');
  });

  it('populates input from injectedInput prop', () => {
    render(<Chat {...defaultProps} injectedInput="injected text" />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    expect(input.value).toBe('injected text');
    expect(defaultProps.onInputConsumed).toHaveBeenCalled();
  });

  it('sends message and shows user bubble on submit', async () => {
    const mockRes = createMockStreamResponse([
      'data: {"content":"Hello"}\n\ndata: [DONE]\n\n',
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockRes);

    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'test message' } });

    await act(async () => {
      fireEvent.submit(input.closest('form'));
    });

    // User message should appear
    expect(screen.getByText('test message')).toBeInTheDocument();
    // Input should be cleared
    expect(input.value).toBe('');

    // Wait for streaming to finish
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('shows reset button after messages and clears on click', async () => {
    const mockRes = createMockStreamResponse([
      'data: {"content":"Response"}\n\ndata: [DONE]\n\n',
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockRes);

    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'hello' } });

    await act(async () => {
      fireEvent.submit(input.closest('form'));
    });

    await waitFor(() => {
      expect(screen.getByText('Nueva conversación')).toBeInTheDocument();
    });

    // Click reset
    fireEvent.click(screen.getByText('Nueva conversación'));

    // Messages should be cleared, empty state returns
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
    expect(screen.queryByText('Nueva conversación')).not.toBeInTheDocument();
    expect(screen.getByText('¿Que es un grupo funcional?')).toBeInTheDocument();
  });

  it('handles error response from server', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'test' } });

    await act(async () => {
      fireEvent.submit(input.closest('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Error: Server error/)).toBeInTheDocument();
    });
  });

  it('handles error when json parsing fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error('parse error')),
    });

    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'test' } });

    await act(async () => {
      fireEvent.submit(input.closest('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Error: Error del servidor/)).toBeInTheDocument();
    });
  });

  it('does not send empty message', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');

    fireEvent.submit(input.closest('form'));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not send whitespace-only message', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: '   ' } });

    fireEvent.submit(input.closest('form'));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('handles molecule data in stream', async () => {
    const mockRes = createMockStreamResponse([
      'data: {"molecule":{"atoms":[{"element":"H","x":0,"y":0}],"bonds":[]}}\n\n',
      'data: {"content":"Drew it"}\n\ndata: [DONE]\n\n',
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockRes);

    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'draw water' } });

    await act(async () => {
      fireEvent.submit(input.closest('form'));
    });

    await waitFor(() => {
      expect(defaultProps.onDrawMolecule).toHaveBeenCalledWith({
        atoms: [{ element: 'H', x: 0, y: 0 }],
        bonds: [],
      });
    });
  });

  it('handles stream with invalid JSON chunks gracefully', async () => {
    const mockRes = createMockStreamResponse([
      'data: not-json\n\n',
      'data: {"content":"OK"}\n\ndata: [DONE]\n\n',
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockRes);

    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'test' } });

    await act(async () => {
      fireEvent.submit(input.closest('form'));
    });

    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
    });
  });

  it('ignores non-data lines in stream', async () => {
    const mockRes = createMockStreamResponse([
      'event: ping\n\ndata: {"content":"Hello"}\n\ndata: [DONE]\n\n',
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockRes);

    render(<Chat {...defaultProps} />);
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'test' } });

    await act(async () => {
      fireEvent.submit(input.closest('form'));
    });

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });
});
