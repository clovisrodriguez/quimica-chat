import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ELEMENTS,
  canBond,
  canIncreaseBondOrder,
  remainingBonds,
  currentBondCount,
  detectFunctionalGroups,
  buildFormula,
  identifyMolecule,
  moleculeToPrompt,
} from '../data/chemistry';
import BohrModel from './BohrModel';
import PeriodicTable from './PeriodicTable';

const ELEMENT_LIST = ['C', 'H', 'O', 'N', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
const GRID_SPACING = 30;
const DRAG_THRESHOLD = 5;
const BOND_OFFSET = 4; // px offset for double/triple bond lines

let nextId = 1;

export default function MoleculeBuilder({ onExplainWithAI, moleculeData, onMoleculeLoaded, bohrElement, onBohrViewed, periodicTableData, onPeriodicTableViewed }) {
  const [atoms, setAtoms] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [selectedElement, setSelectedElement] = useState('C');
  const [bondStart, setBondStart] = useState(null); // atomId for first click in bond creation
  const [hoveredAtom, setHoveredAtom] = useState(null);
  const [hoveredBond, setHoveredBond] = useState(null);
  const [tool, setTool] = useState('place'); // 'place' | 'erase'
  const [viewedElement, setViewedElement] = useState('C');
  const [focusedBohr, setFocusedBohr] = useState(null); // element for full-screen Bohr view
  const [showPeriodicTable, setShowPeriodicTable] = useState(null); // { highlight: [] } or null
  const [bohrFromTable, setBohrFromTable] = useState(null); // periodic table state to return to
  const [showHelp, setShowHelp] = useState(false);

  // Drag state (refs to avoid re-renders during drag)
  const dragRef = useRef(null); // { atomId, startX, startY, origX, origY, dragging }
  const svgRef = useRef(null);

  // ─── Load molecule from AI ───
  useEffect(() => {
    if (!moleculeData) return;
    const { atoms: aiAtoms, bonds: aiBonds } = moleculeData;
    if (!aiAtoms || !Array.isArray(aiAtoms)) return;

    // Map atoms with new IDs
    const newAtoms = aiAtoms.map((a, i) => ({
      id: nextId++,
      element: a.element,
      x: a.x,
      y: a.y,
    }));

    // Convert bond indices (base 0) to atom IDs
    const newBonds = (aiBonds || [])
      .filter((b) => b.from >= 0 && b.from < newAtoms.length && b.to >= 0 && b.to < newAtoms.length)
      .map((b) => ({
        id: nextId++,
        from: newAtoms[b.from].id,
        to: newAtoms[b.to].id,
        order: b.order || 1,
      }));

    setAtoms(newAtoms);
    setBonds(newBonds);
    setBondStart(null);
    onMoleculeLoaded?.();
  }, [moleculeData, onMoleculeLoaded]);

  // ─── Show Bohr model from AI ───
  useEffect(() => {
    if (!bohrElement) return;
    if (ELEMENTS[bohrElement]) {
      setFocusedBohr(bohrElement);
      setViewedElement(bohrElement);
    }
    onBohrViewed?.();
  }, [bohrElement, onBohrViewed]);

  // ─── Show periodic table from AI ───
  useEffect(() => {
    if (!periodicTableData) return;
    setShowPeriodicTable(periodicTableData);
    setFocusedBohr(null);
    onPeriodicTableViewed?.();
  }, [periodicTableData, onPeriodicTableViewed]);

  // ─── SVG coordinate helpers ───
  const svgPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const snapToGrid = useCallback((x, y) => {
    return {
      x: Math.round(x / GRID_SPACING) * GRID_SPACING,
      y: Math.round(y / GRID_SPACING) * GRID_SPACING,
    };
  }, []);

  // ─── Find atom at position ───
  const atomAt = useCallback(
    (x, y) => {
      for (const a of atoms) {
        const r = ELEMENTS[a.element]?.radius || 18;
        const dx = a.x - x;
        const dy = a.y - y;
        if (dx * dx + dy * dy <= (r + 4) * (r + 4)) return a;
      }
      return null;
    },
    [atoms]
  );

  // ─── Find bond near position ───
  const bondAt = useCallback(
    (x, y) => {
      for (const b of bonds) {
        const a1 = atoms.find((a) => a.id === b.from);
        const a2 = atoms.find((a) => a.id === b.to);
        if (!a1 || !a2) continue;
        // Distance from point to line segment
        const dx = a2.x - a1.x;
        const dy = a2.y - a1.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;
        let t = ((x - a1.x) * dx + (y - a1.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const px = a1.x + t * dx;
        const py = a1.y + t * dy;
        const dist = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
        if (dist < 8) return b;
      }
      return null;
    },
    [atoms, bonds]
  );

  // ─── Place atom ───
  const placeAtom = useCallback(
    (x, y) => {
      const snapped = snapToGrid(x, y);
      // Don't place on top of existing atom
      if (atomAt(snapped.x, snapped.y)) return;
      const id = nextId++;
      setAtoms((prev) => [...prev, { id, element: selectedElement, x: snapped.x, y: snapped.y }]);
    },
    [selectedElement, snapToGrid, atomAt]
  );

  // ─── Create bond ───
  const createBond = useCallback(
    (fromId, toId) => {
      const a1 = atoms.find((a) => a.id === fromId);
      const a2 = atoms.find((a) => a.id === toId);
      if (!a1 || !a2) return;
      if (!canBond(a1, a2, atoms, bonds)) return;
      const id = nextId++;
      setBonds((prev) => [...prev, { id, from: fromId, to: toId, order: 1 }]);
    },
    [atoms, bonds]
  );

  // ─── Cycle bond order ───
  const cycleBond = useCallback(
    (bondId) => {
      setBonds((prev) => {
        const idx = prev.findIndex((b) => b.id === bondId);
        if (idx === -1) return prev;
        const bond = prev[idx];
        // Try to increase order
        if (bond.order < 3 && canIncreaseBondOrder(bond, atoms, prev)) {
          const updated = [...prev];
          updated[idx] = { ...bond, order: bond.order + 1 };
          return updated;
        }
        // Otherwise remove
        return prev.filter((b) => b.id !== bondId);
      });
    },
    [atoms]
  );

  // ─── Delete atom and its bonds ───
  const deleteAtom = useCallback((atomId) => {
    setAtoms((prev) => prev.filter((a) => a.id !== atomId));
    setBonds((prev) => prev.filter((b) => b.from !== atomId && b.to !== atomId));
    setBondStart((prev) => (prev === atomId ? null : prev));
  }, []);

  // ─── Delete bond ───
  const deleteBond = useCallback((bondId) => {
    setBonds((prev) => prev.filter((b) => b.id !== bondId));
  }, []);

  // ─── SVG mouse handlers ───
  const handleSvgMouseDown = useCallback(
    (e) => {
      if (e.button === 2) return; // right-click handled separately
      if (tool === 'erase') return; // no drag in eraser mode
      const { x, y } = svgPoint(e.clientX, e.clientY);
      const hit = atomAt(x, y);

      if (hit) {
        // Start potential drag or bond creation
        dragRef.current = {
          atomId: hit.id,
          startX: e.clientX,
          startY: e.clientY,
          origX: hit.x,
          origY: hit.y,
          dragging: false,
        };
      }
    },
    [svgPoint, atomAt, tool]
  );

  const handleSvgMouseMove = useCallback(
    (e) => {
      // Track hover for both modes
      const { x, y } = svgPoint(e.clientX, e.clientY);
      const hitAtom = atomAt(x, y);
      setHoveredAtom(hitAtom ? hitAtom.id : null);

      if (tool === 'erase') {
        const hitBond = hitAtom ? null : bondAt(x, y);
        setHoveredBond(hitBond ? hitBond.id : null);
      } else {
        setHoveredBond(null);
      }

      // Drag logic (only in place mode)
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (!dragRef.current.dragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        dragRef.current.dragging = true;
      }
      if (dragRef.current.dragging) {
        const atomId = dragRef.current.atomId;
        setAtoms((prev) =>
          prev.map((a) => (a.id === atomId ? { ...a, x, y } : a))
        );
      }
    },
    [svgPoint, atomAt, bondAt, tool]
  );

  const handleSvgMouseUp = useCallback(
    (e) => {
      if (e.button === 2) return;
      const { x, y } = svgPoint(e.clientX, e.clientY);

      // ─── Eraser mode ───
      if (tool === 'erase') {
        const hitAtom = atomAt(x, y);
        if (hitAtom) {
          deleteAtom(hitAtom.id);
          return;
        }
        const hitBond = bondAt(x, y);
        if (hitBond) {
          deleteBond(hitBond.id);
          return;
        }
        return; // click on empty → do nothing
      }

      // ─── Place mode ───
      if (dragRef.current) {
        const draggedAtomId = dragRef.current.atomId;

        if (dragRef.current.dragging) {
          // Snap to grid on drop
          const snapped = snapToGrid(x, y);
          dragRef.current = null;
          setAtoms((prev) =>
            prev.map((a) =>
              a.id === draggedAtomId ? { ...a, x: snapped.x, y: snapped.y } : a
            )
          );
          return;
        }

        // It was a click on an atom (no drag)
        dragRef.current = null;

        // Update viewedElement for Bohr model
        const clickedAtom = atoms.find((a) => a.id === draggedAtomId);
        if (clickedAtom) setViewedElement(clickedAtom.element);

        if (bondStart === null) {
          // First atom selected for bond
          setBondStart(draggedAtomId);
        } else if (bondStart === draggedAtomId) {
          // Deselect
          setBondStart(null);
        } else {
          // Second atom → create bond
          createBond(bondStart, draggedAtomId);
          setBondStart(null);
        }
        return;
      }

      // Click on empty space
      const hitBond = bondAt(x, y);
      if (hitBond) {
        cycleBond(hitBond.id);
        setBondStart(null);
        return;
      }

      // Place atom
      setBondStart(null);
      placeAtom(x, y);
    },
    [svgPoint, snapToGrid, bondStart, createBond, bondAt, cycleBond, placeAtom, tool, atomAt, deleteAtom, deleteBond, atoms]
  );

  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      const { x, y } = svgPoint(e.clientX, e.clientY);
      const hit = atomAt(x, y);
      if (hit) deleteAtom(hit.id);
    },
    [svgPoint, atomAt, deleteAtom]
  );

  // ─── Clear all ───
  const handleClear = useCallback(() => {
    setAtoms([]);
    setBonds([]);
    setBondStart(null);
  }, []);

  // ─── Explain with AI ───
  const handleExplain = useCallback(() => {
    if (atoms.length === 0) return;
    const prompt = moleculeToPrompt(atoms, bonds);
    onExplainWithAI(prompt);
  }, [atoms, bonds, onExplainWithAI]);

  // ─── Palette click handler ───
  const handlePaletteClick = useCallback((sym) => {
    setSelectedElement(sym);
    setViewedElement(sym);
    setBondStart(null);
    setTool('place'); // auto-switch back to place mode
  }, []);

  // ─── Computed state ───
  const formula = atoms.length > 0 ? buildFormula(atoms) : '';
  const molecule = identifyMolecule(atoms, bonds);
  const groups = detectFunctionalGroups(atoms, bonds);

  // Collect all atom IDs that are part of functional groups for highlighting
  const highlightedAtomIds = new Set();
  for (const g of groups) {
    for (const id of g.atomIds) highlightedAtomIds.add(id);
  }

  const isErase = tool === 'erase';

  // ─── Render bond lines ───
  function renderBond(bond) {
    const a1 = atoms.find((a) => a.id === bond.from);
    const a2 = atoms.find((a) => a.id === bond.to);
    if (!a1 || !a2) return null;

    const dx = a2.x - a1.x;
    const dy = a2.y - a1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Perpendicular unit vector
    const px = -dy / len;
    const py = dx / len;

    const isHoveredBond = isErase && hoveredBond === bond.id;
    const bondStroke = isHoveredBond ? '#ef4444' : '#9ca3af';
    const hoverClass = isErase ? 'cursor-crosshair hover:stroke-red-500' : 'cursor-pointer hover:stroke-yellow-400';

    const lines = [];
    if (bond.order === 1) {
      lines.push(
        <line
          key={bond.id}
          x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y}
          stroke={bondStroke} strokeWidth={2.5} strokeLinecap="round"
          className={hoverClass}
          style={{ pointerEvents: 'stroke' }}
        />
      );
    } else if (bond.order === 2) {
      lines.push(
        <line key={`${bond.id}-a`}
          x1={a1.x + px * BOND_OFFSET} y1={a1.y + py * BOND_OFFSET}
          x2={a2.x + px * BOND_OFFSET} y2={a2.y + py * BOND_OFFSET}
          stroke={bondStroke} strokeWidth={2} strokeLinecap="round"
          className={hoverClass}
          style={{ pointerEvents: 'stroke' }}
        />,
        <line key={`${bond.id}-b`}
          x1={a1.x - px * BOND_OFFSET} y1={a1.y - py * BOND_OFFSET}
          x2={a2.x - px * BOND_OFFSET} y2={a2.y - py * BOND_OFFSET}
          stroke={bondStroke} strokeWidth={2} strokeLinecap="round"
          className={hoverClass}
          style={{ pointerEvents: 'stroke' }}
        />
      );
    } else if (bond.order === 3) {
      lines.push(
        <line key={`${bond.id}-a`}
          x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y}
          stroke={bondStroke} strokeWidth={2} strokeLinecap="round"
          className={hoverClass}
          style={{ pointerEvents: 'stroke' }}
        />,
        <line key={`${bond.id}-b`}
          x1={a1.x + px * BOND_OFFSET * 1.3} y1={a1.y + py * BOND_OFFSET * 1.3}
          x2={a2.x + px * BOND_OFFSET * 1.3} y2={a2.y + py * BOND_OFFSET * 1.3}
          stroke={bondStroke} strokeWidth={2} strokeLinecap="round"
          className={hoverClass}
          style={{ pointerEvents: 'stroke' }}
        />,
        <line key={`${bond.id}-c`}
          x1={a1.x - px * BOND_OFFSET * 1.3} y1={a1.y - py * BOND_OFFSET * 1.3}
          x2={a2.x - px * BOND_OFFSET * 1.3} y2={a2.y - py * BOND_OFFSET * 1.3}
          stroke={bondStroke} strokeWidth={2} strokeLinecap="round"
          className={hoverClass}
          style={{ pointerEvents: 'stroke' }}
        />
      );
    }
    return lines;
  }

  // ─── Render atom ───
  function renderAtom(atom) {
    const el = ELEMENTS[atom.element];
    if (!el) return null;
    const remaining = remainingBonds(atom, atoms, bonds);
    const isSelected = bondStart === atom.id;
    const isHighlighted = highlightedAtomIds.has(atom.id);
    const isEraseHover = isErase && hoveredAtom === atom.id;

    return (
      <g key={atom.id}>
        {/* Eraser hover ring */}
        {isEraseHover && (
          <circle
            cx={atom.x} cy={atom.y} r={el.radius + 5}
            fill="none" stroke="#ef4444" strokeWidth={2}
            strokeDasharray="4 3"
          />
        )}
        {/* Functional group highlight ring */}
        {isHighlighted && !isEraseHover && (
          <circle
            cx={atom.x} cy={atom.y} r={el.radius + 6}
            fill="none" stroke="#34d399" strokeWidth={1.5}
            strokeDasharray="4 3" opacity={0.7}
          />
        )}
        {/* Selection ring */}
        {isSelected && !isEraseHover && (
          <circle
            cx={atom.x} cy={atom.y} r={el.radius + 4}
            fill="none" stroke="#fbbf24" strokeWidth={2}
          />
        )}
        {/* Atom circle */}
        <circle
          cx={atom.x} cy={atom.y} r={el.radius}
          fill={el.color}
          stroke={isEraseHover ? '#ef4444' : isSelected ? '#fbbf24' : '#555'}
          strokeWidth={isEraseHover ? 2 : isSelected ? 2 : 1}
          className={isErase ? 'cursor-crosshair' : 'cursor-pointer'}
        />
        {/* Element symbol */}
        <text
          x={atom.x} y={atom.y}
          textAnchor="middle" dominantBaseline="central"
          fill={el.textColor}
          fontSize={el.radius > 16 ? 13 : 10}
          fontWeight="bold"
          className="pointer-events-none select-none"
        >
          {el.symbol}
        </text>
        {/* Remaining bonds badge */}
        {remaining > 0 && (
          <>
            <circle
              cx={atom.x + el.radius - 2}
              cy={atom.y - el.radius + 2}
              r={7}
              fill="#1f2937"
              stroke="#4b5563"
              strokeWidth={1}
            />
            <text
              x={atom.x + el.radius - 2}
              y={atom.y - el.radius + 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#9ca3af"
              fontSize={9}
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              {remaining}
            </text>
          </>
        )}
      </g>
    );
  }

  // Format formula with subscripts for display
  function formatFormula(f) {
    if (!f) return null;
    return f.split(/(\d+)/).map((part, i) =>
      /^\d+$/.test(part) ? <sub key={i}>{part}</sub> : <span key={i}>{part}</span>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900/50 shrink-0">
        <h2 className="text-sm font-semibold text-emerald-400">Constructor de Moléculas</h2>
        <p className="text-xs text-gray-500">Arma moléculas átomo por átomo</p>
      </div>

      {/* Atom palette — hidden when Bohr/periodic table overlay is active */}
      {!focusedBohr && !showPeriodicTable && <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/30 shrink-0">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {ELEMENT_LIST.map((sym) => {
            const el = ELEMENTS[sym];
            return (
              <div key={sym} className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => handlePaletteClick(sym)}
                  className={`atom-palette-btn ${selectedElement === sym ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-gray-900' : ''}`}
                  style={{
                    backgroundColor: el.color,
                    color: el.textColor,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    fontSize: 11,
                    fontWeight: 700,
                    border: '2px solid #555',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={`${el.name} (valencia ${el.maxBonds})`}
                >
                  {sym}
                </button>
                <span className="text-[9px] text-gray-500">{el.maxBonds}</span>
              </div>
            );
          })}
        </div>
      </div>}

      {/* Toolbar + Bohr model row — hidden when Bohr/periodic table overlay is active */}
      {!focusedBohr && !showPeriodicTable && (
        <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/30 shrink-0 flex items-center gap-3">
          <div className="flex gap-1.5">
            <button
              onClick={() => { setTool('place'); setBondStart(null); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                tool === 'place'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Colocar
            </button>
            <button
              onClick={() => { setTool('erase'); setBondStart(null); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                tool === 'erase'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Borrador
            </button>
          </div>
          <div className="ml-auto">
            <BohrModel element={viewedElement} />
          </div>
        </div>
      )}

      {/* SVG workspace */}
      <div className="flex-1 overflow-hidden bg-gray-950 relative">
        {/* Periodic table overlay */}
        {showPeriodicTable && (
          <PeriodicTable
            highlight={showPeriodicTable.highlight || []}
            onElementClick={(symbol) => {
              setBohrFromTable(showPeriodicTable);
              setShowPeriodicTable(null);
              setFocusedBohr(symbol);
              setViewedElement(symbol);
            }}
            onClose={() => setShowPeriodicTable(null)}
          />
        )}

        {/* Focused Bohr model overlay */}
        {focusedBohr && ELEMENTS[focusedBohr] && (() => {
          const el = ELEMENTS[focusedBohr];
          const shellCount = el.electronShells.length;
          const baseR = 40;
          const shellGap = 40;
          const electronR = 7;
          const outerR = baseR + shellCount * shellGap;
          const svgSize = outerR * 2 + 40;
          const c = svgSize / 2;
          return (
            <div className="absolute inset-0 z-10 bg-gray-950/95 flex flex-col items-center justify-center gap-4 p-4">
              <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="max-w-full max-h-[75%]">
                {el.electronShells.map((count, i) => {
                  const r = baseR + (i + 1) * shellGap;
                  const electrons = [];
                  for (let j = 0; j < count; j++) {
                    const angle = (2 * Math.PI * j) / count - Math.PI / 2;
                    electrons.push(
                      <circle
                        key={`e-${i}-${j}`}
                        cx={c + r * Math.cos(angle)}
                        cy={c + r * Math.sin(angle)}
                        r={electronR}
                        fill="#60a5fa"
                      />
                    );
                  }
                  return (
                    <g key={`shell-${i}`}>
                      <circle cx={c} cy={c} r={r} fill="none" stroke="#4b5563" strokeWidth={1} strokeDasharray="6 4" />
                      {/* Shell label */}
                      <text x={c + r + 10} y={c - 4} fill="#6b7280" fontSize={11} fontWeight="bold">
                        n={i + 1}
                      </text>
                      <text x={c + r + 10} y={c + 10} fill="#9ca3af" fontSize={10}>
                        {count}e⁻
                      </text>
                      {electrons}
                    </g>
                  );
                })}
                {/* Nucleus */}
                <circle cx={c} cy={c} r={baseR} fill={el.color} stroke="#555" strokeWidth={2} />
                <text x={c} y={c - 8} textAnchor="middle" dominantBaseline="central" fill={el.textColor} fontSize={14} fontWeight="bold">
                  {el.atomicNumber}p⁺
                </text>
                <text x={c} y={c + 10} textAnchor="middle" dominantBaseline="central" fill={el.textColor} fontSize={14} fontWeight="bold">
                  {el.neutrons}n
                </text>
              </svg>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{el.name} ({el.symbol})</p>
                <p className="text-sm text-gray-400">
                  Z={el.atomicNumber} · {el.atomicNumber}p⁺ · {el.neutrons}n · {el.atomicNumber}e⁻
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Capas: {el.electronShells.map((count, i) => `n${i + 1}=${count}`).join(', ')}
                </p>
              </div>
              <div className="flex gap-2">
                {bohrFromTable && (
                  <button
                    onClick={() => {
                      setFocusedBohr(null);
                      setShowPeriodicTable(bohrFromTable);
                      setBohrFromTable(null);
                    }}
                    className="text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    ← Volver a tabla periódica
                  </button>
                )}
                <button
                  onClick={() => { setFocusedBohr(null); setBohrFromTable(null); }}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors"
                >
                  Cerrar modelo de Bohr
                </button>
              </div>
            </div>
          );
        })()}
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: isErase ? 'crosshair' : 'default' }}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onContextMenu={handleContextMenu}
        >
          {/* Grid dots */}
          <defs>
            <pattern id="grid" width={GRID_SPACING} height={GRID_SPACING} patternUnits="userSpaceOnUse">
              <circle cx={GRID_SPACING / 2} cy={GRID_SPACING / 2} r={1} fill="#374151" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Bonds */}
          {bonds.map((b) => renderBond(b))}

          {/* Bond-in-progress line */}
          {bondStart && hoveredAtom && bondStart !== hoveredAtom && !isErase && (
            <line
              x1={atoms.find((a) => a.id === bondStart)?.x}
              y1={atoms.find((a) => a.id === bondStart)?.y}
              x2={atoms.find((a) => a.id === hoveredAtom)?.x}
              y2={atoms.find((a) => a.id === hoveredAtom)?.y}
              stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6}
              className="pointer-events-none"
            />
          )}

          {/* Atoms */}
          {atoms.map((a) => renderAtom(a))}

          {/* Empty state hint */}
          {atoms.length === 0 && (
            <text x="50%" y="50%" textAnchor="middle" fill="#6b7280" fontSize={14}>
              Haz clic para colocar un átomo
            </text>
          )}
        </svg>
      </div>

      {/* Info panel — hidden when Bohr/periodic table overlay is active */}
      {!focusedBohr && !showPeriodicTable && (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/50 shrink-0 space-y-2">
          {atoms.length > 0 ? (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-mono text-emerald-300">{formatFormula(formula)}</span>
                {molecule && (
                  <span className="text-sm font-bold text-white bg-emerald-800/40 px-2 py-0.5 rounded">
                    {molecule.name}
                  </span>
                )}
              </div>
              {groups.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((g, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-800 border border-emerald-700/50 text-emerald-300 px-2 py-0.5 rounded-full"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
              {atoms.some((a) => remainingBonds(a, atoms, bonds) > 0) && (
                <div className="text-xs space-y-1">
                  <p className="text-yellow-500 font-medium">
                    Átomos con enlaces sin completar:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {atoms.filter((a) => remainingBonds(a, atoms, bonds) > 0).map((a) => {
                      const rem = remainingBonds(a, atoms, bonds);
                      return (
                        <span key={a.id} className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 px-1.5 py-0.5 rounded">
                          {a.element} necesita {rem} enlace{rem > 1 ? 's' : ''} más
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {atoms.length > 0 && atoms.every((a) => remainingBonds(a, atoms, bonds) === 0) && bonds.length > 0 && (
                <p className="text-xs text-emerald-500">
                  Todas las valencias están completas.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500 text-center">Haz clic en el área para colocar átomos</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 items-center">
            <button
              onClick={handleExplain}
              disabled={atoms.length === 0}
              className="bg-blue-600/80 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Explicar con IA
            </button>
            <button
              onClick={handleClear}
              disabled={atoms.length === 0}
              className="text-xs text-gray-400 hover:text-white disabled:text-gray-600 px-2 py-1 rounded transition-colors"
            >
              Limpiar todo
            </button>
            <button
              onClick={() => setShowPeriodicTable({ highlight: [] })}
              className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
              title="Tabla periódica"
            >
              📋 Tabla
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              title="Ayuda"
            >
              ? Ayuda
            </button>
          </div>
        </div>
      )}

      {/* Help modal */}
      {showHelp && (
        <div className="absolute inset-0 z-30 bg-gray-950/90 flex items-center justify-center p-6" onClick={() => setShowHelp(false)}>
          <div className="bg-gray-800 rounded-xl p-5 max-w-sm space-y-2 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <p className="font-medium text-gray-200 text-sm">¿Cómo usar el constructor?</p>
            <div className="text-xs text-gray-400 space-y-1.5">
              <p>1. Selecciona un elemento en la paleta (C, H, O...)</p>
              <p>2. Haz clic en el área para colocar átomos</p>
              <p>3. Clic en un átomo y luego en otro para enlazarlos</p>
              <p>4. Clic en un enlace: simple → doble → triple → quitar</p>
              <p>5. Usa "Borrador" o clic derecho para eliminar</p>
              <p className="text-gray-500 mt-2">Valencias: C=4, H=1, O=2, N=3, S=2, P=3</p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
