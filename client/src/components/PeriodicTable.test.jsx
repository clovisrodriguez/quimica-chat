import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PeriodicTable from './PeriodicTable';

describe('PeriodicTable', () => {
  it('renders 118 element cells', () => {
    const { container } = render(<PeriodicTable onClose={() => {}} />);
    // Each element has a div with the symbol as bold text
    const symbols = container.querySelectorAll('.font-bold');
    expect(symbols.length).toBe(118);
  });

  it('renders title', () => {
    render(<PeriodicTable onClose={() => {}} />);
    expect(screen.getByText('Tabla Periódica')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<PeriodicTable onClose={() => {}} />);
    expect(screen.getByText('Cerrar tabla periódica')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<PeriodicTable onClose={onClose} />);
    fireEvent.click(screen.getByText('Cerrar tabla periódica'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onElementClick for supported elements', () => {
    const onClick = vi.fn();
    const { container } = render(<PeriodicTable onElementClick={onClick} onClose={() => {}} />);
    // Find the Oxygen cell by title attribute
    const oxygenCell = container.querySelector('[title*="Oxígeno"]');
    expect(oxygenCell).toBeInTheDocument();
    fireEvent.click(oxygenCell);
    expect(onClick).toHaveBeenCalledWith('O');
  });

  it('does not call onElementClick for unsupported elements', () => {
    const onClick = vi.fn();
    const { container } = render(<PeriodicTable onElementClick={onClick} onClose={() => {}} />);
    // Helium is not supported
    const heliumCell = container.querySelector('[title*="Helio"]');
    expect(heliumCell).toBeInTheDocument();
    fireEvent.click(heliumCell);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies highlight styling to specified elements', () => {
    const { container } = render(
      <PeriodicTable highlight={['C', 'N', 'O']} onClose={() => {}} />
    );
    // Highlighted elements should have ring-2 class
    const carbonCell = container.querySelector('[title*="Carbono"]');
    expect(carbonCell.className).toContain('ring-2');
    // Non-highlighted supported element should not have ring-2
    const hydrogenCell = container.querySelector('[title*="Hidrógeno"]');
    expect(hydrogenCell.className).not.toContain('ring-2');
  });

  it('shows highlight legend when highlights are present', () => {
    render(<PeriodicTable highlight={['C']} onClose={() => {}} />);
    expect(screen.getByText('Resaltado')).toBeInTheDocument();
  });

  it('hides highlight legend when no highlights', () => {
    render(<PeriodicTable onClose={() => {}} />);
    expect(screen.queryByText('Resaltado')).not.toBeInTheDocument();
  });
});
