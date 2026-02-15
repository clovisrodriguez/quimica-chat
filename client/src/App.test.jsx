import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock child components to isolate App logic
vi.mock('./components/Chat', () => ({
  default: ({ injectedInput, onInputConsumed, onDrawMolecule }) => (
    <div data-testid="chat">
      {injectedInput && <span data-testid="injected">{injectedInput}</span>}
      <button onClick={() => onDrawMolecule({ atoms: [{ element: 'H', x: 0, y: 0 }], bonds: [] })}>
        draw
      </button>
    </div>
  ),
}));

vi.mock('./components/ClassMode', () => ({
  default: () => <div data-testid="class-mode" />,
}));

vi.mock('./components/MoleculeBuilder', () => ({
  default: ({ onExplainWithAI, moleculeData, onMoleculeLoaded }) => (
    <div data-testid="molecule-builder">
      {moleculeData && <span data-testid="molecule-data">loaded</span>}
      <button onClick={() => onExplainWithAI('test prompt')}>explain</button>
      {moleculeData && <button onClick={onMoleculeLoaded}>ack</button>}
    </div>
  ),
}));

describe('App', () => {
  it('renders header with app title', () => {
    render(<App />);
    expect(screen.getByText('Quimica Chat')).toBeInTheDocument();
  });

  it('renders both panels (molecule builder and chat)', () => {
    render(<App />);
    expect(screen.getByTestId('molecule-builder')).toBeInTheDocument();
    expect(screen.getByTestId('chat')).toBeInTheDocument();
  });

  it('renders mobile tab buttons', () => {
    render(<App />);
    expect(screen.getByText('Constructor')).toBeInTheDocument();
    const chatLabels = screen.getAllByText('Chat IA');
    expect(chatLabels.length).toBeGreaterThanOrEqual(2); // header toggle + mobile tab
  });

  it('passes explain text from MoleculeBuilder to Chat', () => {
    render(<App />);
    fireEvent.click(screen.getByText('explain'));
    expect(screen.getByTestId('injected')).toHaveTextContent('test prompt');
  });

  it('passes molecule data from Chat to MoleculeBuilder', () => {
    render(<App />);
    fireEvent.click(screen.getByText('draw'));
    expect(screen.getByTestId('molecule-data')).toBeInTheDocument();
  });

  it('clears molecule data after loading', () => {
    render(<App />);
    fireEvent.click(screen.getByText('draw'));
    expect(screen.getByTestId('molecule-data')).toBeInTheDocument();
    fireEvent.click(screen.getByText('ack'));
    expect(screen.queryByTestId('molecule-data')).not.toBeInTheDocument();
  });

  it('switches active tab on mobile tab click', () => {
    render(<App />);
    // Get the mobile tab (second "Chat IA" text - the one inside sm:hidden div)
    const chatTabs = screen.getAllByText('Chat IA');
    const mobileTab = chatTabs[chatTabs.length - 1]; // mobile tab is last
    fireEvent.click(mobileTab);
    // Chat tab should be active (blue border)
    expect(mobileTab).toHaveClass('text-blue-400');
  });

  it('toggles between chat and class mode', () => {
    render(<App />);
    expect(screen.getByTestId('chat')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Modo Clase'));
    expect(screen.getByTestId('class-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument();
  });
});
