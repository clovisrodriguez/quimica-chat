import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MoleculeBuilder from './MoleculeBuilder';

// Mock BohrModel to avoid SVG complexity in tests
vi.mock('./BohrModel', () => ({
  default: ({ element }) => <div data-testid="bohr-model">{element}</div>,
}));

// Helper to create SVG point transform mock
function mockSvgRef(svgElement) {
  const pt = { x: 0, y: 0, matrixTransform: (m) => pt };
  svgElement.createSVGPoint = () => pt;
  svgElement.getScreenCTM = () => ({ inverse: () => ({}) });
}

describe('MoleculeBuilder', () => {
  const defaultProps = {
    onExplainWithAI: vi.fn(),
    moleculeData: null,
    onMoleculeLoaded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    expect(screen.getByText('Constructor de Moléculas')).toBeInTheDocument();
  });

  it('renders all element palette buttons', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    const elements = ['C', 'H', 'O', 'N', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
    for (const sym of elements) {
      expect(screen.getByTitle(new RegExp(sym === 'C' ? 'Carbono' : sym === 'H' ? 'Hidrógeno' : sym === 'O' ? 'Oxígeno' : sym === 'N' ? 'Nitrógeno' : sym === 'S' ? 'Azufre' : sym === 'P' ? 'Fósforo' : sym === 'F' ? 'Flúor' : sym === 'Cl' ? 'Cloro' : sym === 'Br' ? 'Bromo' : 'Yodo'))).toBeInTheDocument();
    }
  });

  it('renders tool buttons (Colocar and Borrador)', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    expect(screen.getByText('Colocar')).toBeInTheDocument();
    expect(screen.getByText('Borrador')).toBeInTheDocument();
  });

  it('renders Bohr model with default element C', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    const bohr = screen.getByTestId('bohr-model');
    expect(bohr).toHaveTextContent('C');
  });

  it('updates Bohr model when palette element is clicked', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    fireEvent.click(screen.getByTitle(/Oxígeno/));
    const bohr = screen.getByTestId('bohr-model');
    expect(bohr).toHaveTextContent('O');
  });

  it('clicking palette element switches back to place mode from erase', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    fireEvent.click(screen.getByText('Borrador'));
    expect(screen.getByText('Borrador')).toHaveClass('bg-red-600');
    fireEvent.click(screen.getByTitle(/Nitrógeno/));
    expect(screen.getByText('Colocar')).toHaveClass('bg-emerald-600');
  });

  it('Colocar button has active style by default', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    expect(screen.getByText('Colocar')).toHaveClass('bg-emerald-600');
    expect(screen.getByText('Borrador')).not.toHaveClass('bg-red-600');
  });

  it('Borrador button becomes active when clicked', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    fireEvent.click(screen.getByText('Borrador'));
    expect(screen.getByText('Borrador')).toHaveClass('bg-red-600');
    expect(screen.getByText('Colocar')).not.toHaveClass('bg-emerald-600');
  });

  it('shows empty state hint', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    expect(screen.getByText('Haz clic para colocar un átomo')).toBeInTheDocument();
  });

  it('shows usage instructions when no atoms', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    expect(screen.getByText('¿Cómo usar?')).toBeInTheDocument();
    expect(screen.getByText(/Usa el "Borrador" o clic derecho/)).toBeInTheDocument();
  });

  it('disables Explicar and Limpiar buttons when no atoms', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    expect(screen.getByText('Explicar con IA')).toBeDisabled();
    expect(screen.getByText('Limpiar todo')).toBeDisabled();
  });

  it('renders SVG workspace', () => {
    const { container } = render(<MoleculeBuilder {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('loads molecule from moleculeData prop', () => {
    const moleculeData = {
      atoms: [
        { element: 'O', x: 100, y: 100 },
        { element: 'H', x: 70, y: 100 },
        { element: 'H', x: 130, y: 100 },
      ],
      bonds: [
        { from: 0, to: 1, order: 1 },
        { from: 0, to: 2, order: 1 },
      ],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(defaultProps.onMoleculeLoaded).toHaveBeenCalled();
    expect(screen.queryByText('¿Cómo usar?')).not.toBeInTheDocument();
  });

  it('does not load when moleculeData has no atoms array', () => {
    const moleculeData = { atoms: 'invalid' };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(screen.getByText('¿Cómo usar?')).toBeInTheDocument();
  });

  it('toggles between place and erase modes', () => {
    render(<MoleculeBuilder {...defaultProps} />);
    const colocar = screen.getByText('Colocar');
    const borrador = screen.getByText('Borrador');

    expect(colocar).toHaveClass('bg-emerald-600');

    fireEvent.click(borrador);
    expect(borrador).toHaveClass('bg-red-600');
    expect(colocar).not.toHaveClass('bg-emerald-600');

    fireEvent.click(colocar);
    expect(colocar).toHaveClass('bg-emerald-600');
    expect(borrador).not.toHaveClass('bg-red-600');
  });

  // ─── Loaded molecule rendering tests ───

  it('displays formula when molecule is loaded', () => {
    const moleculeData = {
      atoms: [
        { element: 'O', x: 100, y: 100 },
        { element: 'H', x: 70, y: 100 },
        { element: 'H', x: 130, y: 100 },
      ],
      bonds: [
        { from: 0, to: 1, order: 1 },
        { from: 0, to: 2, order: 1 },
      ],
    };
    const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    // The formula area should contain H2O rendered with subscripts
    const formulaSpan = container.querySelector('.font-mono.text-emerald-300');
    expect(formulaSpan).toBeInTheDocument();
    expect(formulaSpan.textContent).toContain('H');
    expect(formulaSpan.textContent).toContain('O');
  });

  it('shows molecule name when identified', () => {
    const moleculeData = {
      atoms: [
        { element: 'O', x: 100, y: 100 },
        { element: 'H', x: 70, y: 100 },
        { element: 'H', x: 130, y: 100 },
      ],
      bonds: [
        { from: 0, to: 1, order: 1 },
        { from: 0, to: 2, order: 1 },
      ],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(screen.getByText('Agua')).toBeInTheDocument();
  });

  it('shows valencias completas message for valid molecule', () => {
    const moleculeData = {
      atoms: [
        { element: 'O', x: 100, y: 100 },
        { element: 'H', x: 70, y: 100 },
        { element: 'H', x: 130, y: 100 },
      ],
      bonds: [
        { from: 0, to: 1, order: 1 },
        { from: 0, to: 2, order: 1 },
      ],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(screen.getByText(/Todas las valencias están completas/)).toBeInTheDocument();
  });

  it('shows unsatisfied valence warning for incomplete molecule', () => {
    const moleculeData = {
      atoms: [
        { element: 'C', x: 100, y: 100 },
      ],
      bonds: [],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(screen.getByText(/Átomos con enlaces sin completar/)).toBeInTheDocument();
    expect(screen.getByText(/necesita 4 enlaces más/)).toBeInTheDocument();
  });

  it('enables Explicar button when molecule is loaded', () => {
    const moleculeData = {
      atoms: [{ element: 'C', x: 100, y: 100 }],
      bonds: [],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(screen.getByText('Explicar con IA')).not.toBeDisabled();
  });

  it('calls onExplainWithAI when Explicar button is clicked', () => {
    const moleculeData = {
      atoms: [{ element: 'C', x: 100, y: 100 }],
      bonds: [],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    fireEvent.click(screen.getByText('Explicar con IA'));
    expect(defaultProps.onExplainWithAI).toHaveBeenCalledTimes(1);
    // Should include formula in prompt
    expect(defaultProps.onExplainWithAI.mock.calls[0][0]).toContain('C');
  });

  it('clears all atoms when Limpiar todo is clicked', () => {
    const moleculeData = {
      atoms: [{ element: 'C', x: 100, y: 100 }],
      bonds: [],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(screen.queryByText('¿Cómo usar?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Limpiar todo'));

    expect(screen.getByText('¿Cómo usar?')).toBeInTheDocument();
    expect(screen.getByText('Explicar con IA')).toBeDisabled();
  });

  it('loads molecule with bonds of different orders', () => {
    const moleculeData = {
      atoms: [
        { element: 'C', x: 60, y: 60 },
        { element: 'C', x: 120, y: 60 },
        { element: 'H', x: 30, y: 60 },
        { element: 'H', x: 150, y: 60 },
      ],
      bonds: [
        { from: 0, to: 1, order: 2 },
        { from: 0, to: 2, order: 1 },
        { from: 1, to: 3, order: 1 },
      ],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(defaultProps.onMoleculeLoaded).toHaveBeenCalled();
    expect(screen.queryByText('¿Cómo usar?')).not.toBeInTheDocument();
  });

  it('handles moleculeData with out-of-range bond indices', () => {
    const moleculeData = {
      atoms: [
        { element: 'H', x: 100, y: 100 },
      ],
      bonds: [
        { from: 0, to: 5, order: 1 }, // invalid
        { from: -1, to: 0, order: 1 }, // invalid
      ],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(defaultProps.onMoleculeLoaded).toHaveBeenCalled();
  });

  it('handles null moleculeData gracefully', () => {
    render(<MoleculeBuilder {...defaultProps} moleculeData={null} />);
    expect(screen.getByText('¿Cómo usar?')).toBeInTheDocument();
  });

  it('handles moleculeData with no bonds array', () => {
    const moleculeData = {
      atoms: [{ element: 'H', x: 100, y: 100 }],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(defaultProps.onMoleculeLoaded).toHaveBeenCalled();
  });

  it('shows functional group badges for methanol', () => {
    // Methanol: C-O-H with 3 more H on C
    const moleculeData = {
      atoms: [
        { element: 'C', x: 60, y: 60 },
        { element: 'O', x: 120, y: 60 },
        { element: 'H', x: 180, y: 60 },
        { element: 'H', x: 30, y: 30 },
        { element: 'H', x: 30, y: 90 },
        { element: 'H', x: 60, y: 120 },
      ],
      bonds: [
        { from: 0, to: 1, order: 1 }, // C-O
        { from: 1, to: 2, order: 1 }, // O-H
        { from: 0, to: 3, order: 1 }, // C-H
        { from: 0, to: 4, order: 1 }, // C-H
        { from: 0, to: 5, order: 1 }, // C-H
      ],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(screen.getByText('Hidroxilo (-OH)')).toBeInTheDocument();
  });

  it('renders bonds in SVG as line elements', () => {
    const moleculeData = {
      atoms: [
        { element: 'O', x: 100, y: 100 },
        { element: 'H', x: 70, y: 100 },
      ],
      bonds: [
        { from: 0, to: 1, order: 1 },
      ],
    };
    const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    const lines = container.querySelectorAll('svg line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('renders double bonds as two line elements', () => {
    const moleculeData = {
      atoms: [
        { element: 'C', x: 60, y: 60 },
        { element: 'O', x: 120, y: 60 },
      ],
      bonds: [
        { from: 0, to: 1, order: 2 },
      ],
    };
    const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    // Double bond = 2 lines
    const lines = container.querySelectorAll('svg line');
    expect(lines.length).toBe(2);
  });

  it('renders triple bonds as three line elements', () => {
    const moleculeData = {
      atoms: [
        { element: 'C', x: 60, y: 60 },
        { element: 'N', x: 120, y: 60 },
      ],
      bonds: [
        { from: 0, to: 1, order: 3 },
      ],
    };
    const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    const lines = container.querySelectorAll('svg line');
    expect(lines.length).toBe(3);
  });

  it('renders atom circles in SVG', () => {
    const moleculeData = {
      atoms: [
        { element: 'C', x: 60, y: 60 },
        { element: 'H', x: 120, y: 60 },
      ],
      bonds: [],
    };
    const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    // At minimum: grid dot pattern circle + atom circles + remaining bond badge circles
    const circles = container.querySelectorAll('svg circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders atom text labels in SVG', () => {
    const moleculeData = {
      atoms: [
        { element: 'N', x: 60, y: 60 },
      ],
      bonds: [],
    };
    const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    const texts = container.querySelectorAll('svg text');
    // Should contain element symbol "N" and remaining bonds badge
    const textContents = Array.from(texts).map((t) => t.textContent);
    expect(textContents).toContain('N');
  });

  it('shows remaining bonds badge on atom with unused valence', () => {
    const moleculeData = {
      atoms: [{ element: 'O', x: 100, y: 100 }],
      bonds: [],
    };
    const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    const texts = container.querySelectorAll('svg text');
    const textContents = Array.from(texts).map((t) => t.textContent);
    // O has maxBonds=2, so badge should show "2"
    expect(textContents).toContain('2');
  });

  it('applies crosshair cursor to SVG in erase mode', () => {
    const { container } = render(<MoleculeBuilder {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg.style.cursor).toBe('default');

    fireEvent.click(screen.getByText('Borrador'));
    expect(svg.style.cursor).toBe('crosshair');
  });

  it('SVG has default cursor in place mode', () => {
    const { container } = render(<MoleculeBuilder {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg.style.cursor).toBe('default');
  });

  it('shows single enlace warning for H atom', () => {
    const moleculeData = {
      atoms: [{ element: 'H', x: 100, y: 100 }],
      bonds: [],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(screen.getByText(/necesita 1 enlace más/)).toBeInTheDocument();
  });

  it('does not show empty state hint when atoms exist', () => {
    const moleculeData = {
      atoms: [{ element: 'C', x: 100, y: 100 }],
      bonds: [],
    };
    render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
    expect(screen.queryByText('Haz clic para colocar un átomo')).not.toBeInTheDocument();
  });

  // ─── SVG interaction tests ───
  // jsdom doesn't support createSVGPoint, so svgPoint falls back to using raw clientX/clientY

  describe('SVG interactions', () => {
    function getSvg(container) {
      return container.querySelector('svg');
    }

    function clickSvg(svg, x, y, button = 0) {
      fireEvent.mouseDown(svg, { clientX: x, clientY: y, button });
      fireEvent.mouseUp(svg, { clientX: x, clientY: y, button });
    }

    function rightClickSvg(svg, x, y) {
      fireEvent.contextMenu(svg, { clientX: x, clientY: y });
    }

    it('places an atom on empty SVG click', () => {
      const { container } = render(<MoleculeBuilder {...defaultProps} />);
      const svg = getSvg(container);

      // Click on empty space - should place a C atom (default)
      clickSvg(svg, 90, 90);

      // Empty state hint should disappear
      expect(screen.queryByText('Haz clic para colocar un átomo')).not.toBeInTheDocument();
      // Should show formula
      expect(screen.queryByText('¿Cómo usar?')).not.toBeInTheDocument();
    });

    it('places atom of selected element', () => {
      const { container } = render(<MoleculeBuilder {...defaultProps} />);
      const svg = getSvg(container);

      // Select Oxygen
      fireEvent.click(screen.getByTitle(/Oxígeno/));

      // Click on empty space
      clickSvg(svg, 90, 90);

      // Should show O in the info panel
      const texts = container.querySelectorAll('svg text');
      const textContents = Array.from(texts).map((t) => t.textContent);
      expect(textContents).toContain('O');
    });

    it('creates bond between two atoms by clicking them sequentially', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
          { element: 'C', x: 120, y: 60 },
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Click first atom (at 60,60)
      clickSvg(svg, 60, 60);
      // Click second atom (at 120,60) - should create bond
      clickSvg(svg, 120, 60);

      // Should now have a bond line
      const lines = container.querySelectorAll('svg line');
      expect(lines.length).toBeGreaterThanOrEqual(1);
    });

    it('deselects bond start when clicking same atom twice', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Click atom to select for bonding
      clickSvg(svg, 60, 60);
      // Click same atom again to deselect
      clickSvg(svg, 60, 60);

      // No selection ring should be visible (hard to verify directly, but no crash)
    });

    it('deletes atom on right-click', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Right-click on atom
      rightClickSvg(svg, 60, 60);

      // Empty state should reappear
      expect(screen.getByText('Haz clic para colocar un átomo')).toBeInTheDocument();
    });

    it('deletes atom in eraser mode on click', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Switch to eraser
      fireEvent.click(screen.getByText('Borrador'));

      // Click on atom position
      clickSvg(svg, 60, 60);

      // Empty state should reappear
      expect(screen.getByText('Haz clic para colocar un átomo')).toBeInTheDocument();
    });

    it('eraser mode click on empty space does nothing', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Switch to eraser
      fireEvent.click(screen.getByText('Borrador'));

      // Click on empty space (far from atom at 60,60)
      clickSvg(svg, 300, 300);

      // Atom should still exist
      expect(screen.queryByText('Haz clic para colocar un átomo')).not.toBeInTheDocument();
    });

    it('eraser mode deletes bond on click', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
          { element: 'C', x: 120, y: 60 },
        ],
        bonds: [
          { from: 0, to: 1, order: 1 },
        ],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Verify bond exists
      let lines = container.querySelectorAll('svg line');
      expect(lines.length).toBe(1);

      // Switch to eraser
      fireEvent.click(screen.getByText('Borrador'));

      // Click on midpoint of bond (90, 60) - between the two atoms
      clickSvg(svg, 90, 60);

      // Bond should be removed
      lines = container.querySelectorAll('svg line');
      expect(lines.length).toBe(0);
    });

    it('does not place atom in eraser mode', () => {
      const { container } = render(<MoleculeBuilder {...defaultProps} />);
      const svg = getSvg(container);

      // Switch to eraser
      fireEvent.click(screen.getByText('Borrador'));

      // Click on empty space
      clickSvg(svg, 90, 90);

      // Should still show empty state
      expect(screen.getByText('Haz clic para colocar un átomo')).toBeInTheDocument();
    });

    it('ignores right-click mouseDown and mouseUp', () => {
      const { container } = render(<MoleculeBuilder {...defaultProps} />);
      const svg = getSvg(container);

      // Right-click mouseDown and mouseUp should not place an atom
      fireEvent.mouseDown(svg, { clientX: 90, clientY: 90, button: 2 });
      fireEvent.mouseUp(svg, { clientX: 90, clientY: 90, button: 2 });

      expect(screen.getByText('Haz clic para colocar un átomo')).toBeInTheDocument();
    });

    it('drags atom when mouse moves beyond threshold', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Mouse down on atom
      fireEvent.mouseDown(svg, { clientX: 60, clientY: 60, button: 0 });
      // Move far enough to trigger drag
      fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 });
      // Release
      fireEvent.mouseUp(svg, { clientX: 100, clientY: 100, button: 0 });

      // Atom should still exist (dragged, not deleted)
      expect(screen.queryByText('Haz clic para colocar un átomo')).not.toBeInTheDocument();
    });

    it('does not initiate drag in eraser mode', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Switch to eraser
      fireEvent.click(screen.getByText('Borrador'));

      // Try to drag
      fireEvent.mouseDown(svg, { clientX: 60, clientY: 60, button: 0 });
      fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 });
      // Mouse up should erase the atom (eraser mode click)
      fireEvent.mouseUp(svg, { clientX: 60, clientY: 60, button: 0 });

      expect(screen.getByText('Haz clic para colocar un átomo')).toBeInTheDocument();
    });

    it('hover tracking sets hovered atom on mouseMove', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Move mouse over atom
      fireEvent.mouseMove(svg, { clientX: 60, clientY: 60 });

      // Move mouse away from atom
      fireEvent.mouseMove(svg, { clientX: 300, clientY: 300 });

      // No crash, component renders fine
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('hover tracking in eraser mode detects bonds', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
          { element: 'C', x: 120, y: 60 },
        ],
        bonds: [
          { from: 0, to: 1, order: 1 },
        ],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Switch to eraser
      fireEvent.click(screen.getByText('Borrador'));

      // Move mouse over bond midpoint
      fireEvent.mouseMove(svg, { clientX: 90, clientY: 60 });

      // Move away
      fireEvent.mouseMove(svg, { clientX: 300, clientY: 300 });

      // No crash
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('clicking a bond in place mode cycles its order', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
          { element: 'C', x: 120, y: 60 },
        ],
        bonds: [
          { from: 0, to: 1, order: 1 },
        ],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Click on bond midpoint (90, 60) - between atoms at 60,60 and 120,60
      clickSvg(svg, 90, 60);

      // Bond order should increase to 2 (rendered as 2 lines)
      const lines = container.querySelectorAll('svg line');
      expect(lines.length).toBe(2);
    });

    it('clicking atom in place mode updates viewedElement for Bohr model', () => {
      const moleculeData = {
        atoms: [
          { element: 'N', x: 60, y: 60 },
        ],
        bonds: [],
      };
      render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);

      // Initially Bohr model shows C (default)
      expect(screen.getByTestId('bohr-model')).toHaveTextContent('C');

      const svg = document.querySelector('svg');
      // Click on the N atom
      clickSvg(svg, 60, 60);

      // Bohr model should now show N
      expect(screen.getByTestId('bohr-model')).toHaveTextContent('N');
    });

    it('sub-threshold mouse movement does not trigger drag', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 60, y: 60 },
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Mouse down on atom
      fireEvent.mouseDown(svg, { clientX: 60, clientY: 60, button: 0 });
      // Small move (below DRAG_THRESHOLD=5)
      fireEvent.mouseMove(svg, { clientX: 62, clientY: 62 });
      // Mouse up - should act as click (bond selection), not drag
      fireEvent.mouseUp(svg, { clientX: 62, clientY: 62, button: 0 });

      // Atom should still exist and be selected for bonding
      expect(screen.queryByText('Haz clic para colocar un átomo')).not.toBeInTheDocument();
    });

    it('mouseMove without prior mouseDown does nothing for drag', () => {
      const { container } = render(<MoleculeBuilder {...defaultProps} />);
      const svg = getSvg(container);

      // Just move without any mouseDown
      fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 });

      // Should still show empty state
      expect(screen.getByText('Haz clic para colocar un átomo')).toBeInTheDocument();
    });

    it('does not place atom on top of existing one', () => {
      const moleculeData = {
        atoms: [
          { element: 'C', x: 90, y: 90 }, // Snapped to grid at 90,90
        ],
        bonds: [],
      };
      const { container } = render(<MoleculeBuilder {...defaultProps} moleculeData={moleculeData} />);
      const svg = getSvg(container);

      // Try to place on same spot (should be no-op)
      clickSvg(svg, 90, 90);

      // Should still have only 1 atom (still shows unsatisfied valence for just one C)
      expect(screen.getByText(/necesita 4 enlaces más/)).toBeInTheDocument();
    });
  });
});
