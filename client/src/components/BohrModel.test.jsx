import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BohrModel from './BohrModel';

describe('BohrModel', () => {
  it('renders null when no element provided', () => {
    const { container } = render(<BohrModel element={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders null for unknown element', () => {
    const { container } = render(<BohrModel element="Xx" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders SVG for carbon', () => {
    const { container } = render(<BohrModel element="C" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows proton and neutron counts for carbon', () => {
    render(<BohrModel element="C" />);
    expect(screen.getByText('6p+')).toBeInTheDocument();
    expect(screen.getByText('6n')).toBeInTheDocument();
  });

  it('shows element name in legend', () => {
    render(<BohrModel element="C" />);
    expect(screen.getByText('Carbono (C)')).toBeInTheDocument();
  });

  it('shows legend details with electron count', () => {
    render(<BohrModel element="O" />);
    expect(screen.getByText('Oxígeno (O)')).toBeInTheDocument();
    // Legend line contains proton, neutron, and electron counts
    expect(screen.getByText(/8p⁺ · 8n · 8e⁻/)).toBeInTheDocument();
  });

  it('renders correct number of electron shell circles for hydrogen (1 shell)', () => {
    const { container } = render(<BohrModel element="H" />);
    // 1 shell ring + 1 nucleus = at least 2 circles; also 1 electron dot
    const circles = container.querySelectorAll('circle');
    // nucleus(1) + shell ring(1) + electrons(1) = 3
    expect(circles.length).toBe(3);
  });

  it('renders correct number of shells for sulfur (3 shells)', () => {
    const { container } = render(<BohrModel element="S" />);
    // S has electronShells [2, 8, 6] = 3 shell rings + nucleus + 16 electron dots = 20
    const circles = container.querySelectorAll('circle');
    // nucleus(1) + shell rings(3) + electrons(2+8+6=16) = 20
    expect(circles.length).toBe(20);
  });

  it('renders correct number of shells for bromine (4 shells)', () => {
    const { container } = render(<BohrModel element="Br" />);
    // Br: [2, 8, 18, 7] = 4 shell rings + nucleus + 35 electrons = 40
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(40);
  });

  it('renders correct number for iodine (5 shells)', () => {
    const { container } = render(<BohrModel element="I" />);
    // I: [2, 8, 18, 18, 7] = 5 shell rings + nucleus + 53 electrons = 59
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(59);
  });

  it('shows proton/neutron counts for nitrogen', () => {
    render(<BohrModel element="N" />);
    expect(screen.getByText('7p+')).toBeInTheDocument();
    expect(screen.getByText('7n')).toBeInTheDocument();
    expect(screen.getByText('Nitrógeno (N)')).toBeInTheDocument();
  });

  it('shows 0n for hydrogen (no neutrons)', () => {
    render(<BohrModel element="H" />);
    expect(screen.getByText('1p+')).toBeInTheDocument();
    expect(screen.getByText('0n')).toBeInTheDocument();
  });
});
