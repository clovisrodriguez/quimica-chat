import { describe, it, expect } from 'vitest';
import {
  ELEMENTS,
  currentBondCount,
  remainingBonds,
  canBond,
  canIncreaseBondOrder,
  getNeighbors,
  detectFunctionalGroups,
  buildFormula,
  identifyMolecule,
  moleculeToPrompt,
  KNOWN_MOLECULES,
} from './chemistry';

// ─── Helper factories ───

let _id = 1000;
function makeAtom(element, x = 0, y = 0) {
  return { id: _id++, element, x, y };
}

function makeBond(from, to, order = 1) {
  return { id: _id++, from, to, order };
}

// ─── ELEMENTS data ───

describe('ELEMENTS', () => {
  it('contains all 10 elements', () => {
    const symbols = ['C', 'H', 'O', 'N', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
    for (const s of symbols) {
      expect(ELEMENTS[s]).toBeDefined();
      expect(ELEMENTS[s].symbol).toBe(s);
    }
  });

  it('has required properties for each element', () => {
    for (const key of Object.keys(ELEMENTS)) {
      const el = ELEMENTS[key];
      expect(el).toHaveProperty('name');
      expect(el).toHaveProperty('maxBonds');
      expect(el).toHaveProperty('color');
      expect(el).toHaveProperty('textColor');
      expect(el).toHaveProperty('radius');
      expect(el).toHaveProperty('atomicNumber');
      expect(el).toHaveProperty('neutrons');
      expect(el).toHaveProperty('electronShells');
      expect(Array.isArray(el.electronShells)).toBe(true);
    }
  });

  it('has correct atomic numbers', () => {
    expect(ELEMENTS.C.atomicNumber).toBe(6);
    expect(ELEMENTS.H.atomicNumber).toBe(1);
    expect(ELEMENTS.O.atomicNumber).toBe(8);
    expect(ELEMENTS.N.atomicNumber).toBe(7);
    expect(ELEMENTS.Br.atomicNumber).toBe(35);
    expect(ELEMENTS.I.atomicNumber).toBe(53);
  });

  it('electron shells sum equals atomic number', () => {
    for (const key of Object.keys(ELEMENTS)) {
      const el = ELEMENTS[key];
      const totalElectrons = el.electronShells.reduce((a, b) => a + b, 0);
      expect(totalElectrons).toBe(el.atomicNumber);
    }
  });

  it('has correct valences', () => {
    expect(ELEMENTS.C.maxBonds).toBe(4);
    expect(ELEMENTS.H.maxBonds).toBe(1);
    expect(ELEMENTS.O.maxBonds).toBe(2);
    expect(ELEMENTS.N.maxBonds).toBe(3);
    expect(ELEMENTS.F.maxBonds).toBe(1);
    expect(ELEMENTS.Cl.maxBonds).toBe(1);
  });
});

// ─── currentBondCount ───

describe('currentBondCount', () => {
  it('returns 0 when atom has no bonds', () => {
    expect(currentBondCount(1, [])).toBe(0);
  });

  it('counts single bonds', () => {
    const bonds = [makeBond(1, 2), makeBond(1, 3)];
    expect(currentBondCount(1, bonds)).toBe(2);
  });

  it('counts bond orders correctly', () => {
    const bonds = [makeBond(1, 2, 2), makeBond(1, 3, 1)];
    expect(currentBondCount(1, bonds)).toBe(3);
  });

  it('counts triple bonds', () => {
    const bonds = [makeBond(1, 2, 3)];
    expect(currentBondCount(1, bonds)).toBe(3);
  });

  it('counts bonds where atom is the "to" side', () => {
    const bonds = [makeBond(5, 1, 1), makeBond(6, 1, 2)];
    expect(currentBondCount(1, bonds)).toBe(3);
  });

  it('ignores bonds not involving the atom', () => {
    const bonds = [makeBond(2, 3), makeBond(4, 5)];
    expect(currentBondCount(1, bonds)).toBe(0);
  });
});

// ─── remainingBonds ───

describe('remainingBonds', () => {
  it('returns full valence for unbonded carbon', () => {
    const atom = makeAtom('C');
    expect(remainingBonds(atom, [], [])).toBe(4);
  });

  it('returns 0 when valence is fully used', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const bonds = [makeBond(1, 2), makeBond(1, 3), makeBond(1, 4), makeBond(1, 5)];
    expect(remainingBonds(c, [c], bonds)).toBe(0);
  });

  it('returns 0 for unknown element', () => {
    const atom = { id: 1, element: 'Xx', x: 0, y: 0 };
    expect(remainingBonds(atom, [], [])).toBe(0);
  });

  it('accounts for double bonds in remaining count', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const bonds = [makeBond(1, 2, 2)];
    expect(remainingBonds(c, [c], bonds)).toBe(2);
  });
});

// ─── canBond ───

describe('canBond', () => {
  it('returns false for same atom', () => {
    const atom = makeAtom('C');
    expect(canBond(atom, atom, [atom], [])).toBe(false);
  });

  it('returns true for two unbonded atoms with capacity', () => {
    const a = { id: 1, element: 'C', x: 0, y: 0 };
    const b = { id: 2, element: 'C', x: 30, y: 0 };
    expect(canBond(a, b, [a, b], [])).toBe(true);
  });

  it('returns false when already bonded', () => {
    const a = { id: 1, element: 'C', x: 0, y: 0 };
    const b = { id: 2, element: 'C', x: 30, y: 0 };
    const bonds = [makeBond(1, 2)];
    expect(canBond(a, b, [a, b], bonds)).toBe(false);
  });

  it('returns false when already bonded (reverse direction)', () => {
    const a = { id: 1, element: 'C', x: 0, y: 0 };
    const b = { id: 2, element: 'C', x: 30, y: 0 };
    const bonds = [makeBond(2, 1)];
    expect(canBond(a, b, [a, b], bonds)).toBe(false);
  });

  it('returns false when one atom has no remaining bonds', () => {
    const h = { id: 1, element: 'H', x: 0, y: 0 };
    const c = { id: 2, element: 'C', x: 30, y: 0 };
    const h2 = { id: 3, element: 'H', x: 60, y: 0 };
    const bonds = [makeBond(1, 2)]; // H is full (maxBonds=1)
    expect(canBond(h, h2, [h, c, h2], bonds)).toBe(false);
  });

  it('allows bonding when both atoms have remaining capacity', () => {
    const c1 = { id: 1, element: 'C', x: 0, y: 0 };
    const c2 = { id: 2, element: 'C', x: 30, y: 0 };
    const h = { id: 3, element: 'H', x: 0, y: 30 };
    const bonds = [makeBond(1, 3)]; // C1 has 3 remaining
    expect(canBond(c1, c2, [c1, c2, h], bonds)).toBe(true);
  });
});

// ─── canIncreaseBondOrder ───

describe('canIncreaseBondOrder', () => {
  it('returns false when bond is already triple', () => {
    const a = { id: 1, element: 'C', x: 0, y: 0 };
    const b = { id: 2, element: 'C', x: 30, y: 0 };
    const bond = { id: 100, from: 1, to: 2, order: 3 };
    expect(canIncreaseBondOrder(bond, [a, b], [bond])).toBe(false);
  });

  it('returns false when atoms not found', () => {
    const bond = { id: 100, from: 1, to: 2, order: 1 };
    expect(canIncreaseBondOrder(bond, [], [bond])).toBe(false);
  });

  it('allows increasing from single to double on C-C', () => {
    const a = { id: 1, element: 'C', x: 0, y: 0 };
    const b = { id: 2, element: 'C', x: 30, y: 0 };
    const bond = { id: 100, from: 1, to: 2, order: 1 };
    expect(canIncreaseBondOrder(bond, [a, b], [bond])).toBe(true);
  });

  it('returns false when atom A is at capacity', () => {
    const a = { id: 1, element: 'C', x: 0, y: 0 };
    const b = { id: 2, element: 'C', x: 30, y: 0 };
    const bond = { id: 100, from: 1, to: 2, order: 1 };
    // Give C1 three more bonds to fill its 4 capacity
    const extra = [
      makeBond(1, 10), makeBond(1, 11), makeBond(1, 12),
    ];
    expect(canIncreaseBondOrder(bond, [a, b], [bond, ...extra])).toBe(false);
  });

  it('allows double to triple on C≡C', () => {
    const a = { id: 1, element: 'C', x: 0, y: 0 };
    const b = { id: 2, element: 'C', x: 30, y: 0 };
    const bond = { id: 100, from: 1, to: 2, order: 2 };
    expect(canIncreaseBondOrder(bond, [a, b], [bond])).toBe(true);
  });
});

// ─── getNeighbors ───

describe('getNeighbors', () => {
  it('returns empty array for isolated atom', () => {
    const a = makeAtom('C');
    expect(getNeighbors(a.id, [a], [])).toEqual([]);
  });

  it('returns neighbors from "from" side', () => {
    const a = { id: 1, element: 'C', x: 0, y: 0 };
    const b = { id: 2, element: 'H', x: 30, y: 0 };
    const bond = { id: 100, from: 1, to: 2, order: 1 };
    const neighbors = getNeighbors(1, [a, b], [bond]);
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0].atom.id).toBe(2);
    expect(neighbors[0].bond.order).toBe(1);
  });

  it('returns neighbors from "to" side', () => {
    const a = { id: 1, element: 'C', x: 0, y: 0 };
    const b = { id: 2, element: 'H', x: 30, y: 0 };
    const bond = { id: 100, from: 1, to: 2, order: 1 };
    const neighbors = getNeighbors(2, [a, b], [bond]);
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0].atom.id).toBe(1);
  });

  it('returns multiple neighbors', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const h1 = { id: 2, element: 'H', x: 30, y: 0 };
    const h2 = { id: 3, element: 'H', x: 0, y: 30 };
    const atoms = [c, h1, h2];
    const bonds = [
      { id: 100, from: 1, to: 2, order: 1 },
      { id: 101, from: 1, to: 3, order: 1 },
    ];
    const neighbors = getNeighbors(1, atoms, bonds);
    expect(neighbors).toHaveLength(2);
  });
});

// ─── buildFormula ───

describe('buildFormula', () => {
  it('returns empty string for no atoms', () => {
    expect(buildFormula([])).toBe('');
  });

  it('builds simple formula for single atom', () => {
    expect(buildFormula([makeAtom('C')])).toBe('C');
  });

  it('uses Hill order (C first, H second, then alphabetical)', () => {
    const atoms = [
      makeAtom('O'), makeAtom('C'), makeAtom('H'), makeAtom('H'),
      makeAtom('C'), makeAtom('H'), makeAtom('H'), makeAtom('H'), makeAtom('H'),
    ];
    expect(buildFormula(atoms)).toBe('C2H6O');
  });

  it('omits subscript 1', () => {
    const atoms = [makeAtom('C'), makeAtom('H'), makeAtom('N')];
    expect(buildFormula(atoms)).toBe('CHN');
  });

  it('handles no carbon - alphabetical order', () => {
    const atoms = [makeAtom('H'), makeAtom('H'), makeAtom('O')];
    expect(buildFormula(atoms)).toBe('H2O');
  });

  it('handles formula with multiple non-C,H elements', () => {
    const atoms = [makeAtom('C'), makeAtom('H'), makeAtom('N'), makeAtom('O'), makeAtom('O')];
    expect(buildFormula(atoms)).toBe('CHNO2');
  });
});

// ─── identifyMolecule ───

describe('identifyMolecule', () => {
  it('returns null for empty atoms', () => {
    expect(identifyMolecule([], [])).toBeNull();
  });

  it('identifies water (H2O)', () => {
    const o = { id: 1, element: 'O', x: 60, y: 60 };
    const h1 = { id: 2, element: 'H', x: 30, y: 60 };
    const h2 = { id: 3, element: 'H', x: 90, y: 60 };
    const atoms = [o, h1, h2];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 1 },
      { id: 11, from: 1, to: 3, order: 1 },
    ];
    const result = identifyMolecule(atoms, bonds);
    expect(result).not.toBeNull();
    expect(result.name).toBe('Agua');
  });

  it('identifies methane (CH4)', () => {
    const c = { id: 1, element: 'C', x: 60, y: 60 };
    const atoms = [
      c,
      { id: 2, element: 'H', x: 30, y: 60 },
      { id: 3, element: 'H', x: 90, y: 60 },
      { id: 4, element: 'H', x: 60, y: 30 },
      { id: 5, element: 'H', x: 60, y: 90 },
    ];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 1 },
      { id: 11, from: 1, to: 3, order: 1 },
      { id: 12, from: 1, to: 4, order: 1 },
      { id: 13, from: 1, to: 5, order: 1 },
    ];
    const result = identifyMolecule(atoms, bonds);
    expect(result).not.toBeNull();
    expect(result.name).toBe('Metano');
  });

  it('returns null for unknown formula', () => {
    const atoms = [makeAtom('Br'), makeAtom('Br'), makeAtom('Br')];
    expect(identifyMolecule(atoms, [])).toBeNull();
  });

  it('distinguishes etanol vs dimetileter (same formula C2H6O)', () => {
    // Ethanol: C-C, C-O, O-H
    const c1 = { id: 1, element: 'C', x: 0, y: 0 };
    const c2 = { id: 2, element: 'C', x: 30, y: 0 };
    const o = { id: 3, element: 'O', x: 60, y: 0 };
    const hs = [4, 5, 6, 7, 8, 9].map((id, i) => ({ id, element: 'H', x: i * 10, y: 30 }));
    const atoms = [c1, c2, o, ...hs];
    const bonds = [
      { id: 100, from: 1, to: 2, order: 1 }, // C-C
      { id: 101, from: 2, to: 3, order: 1 }, // C-O
      { id: 102, from: 3, to: 4, order: 1 }, // O-H
      // rest are C-H bonds filling valences
      { id: 103, from: 1, to: 5, order: 1 },
      { id: 104, from: 1, to: 6, order: 1 },
      { id: 105, from: 1, to: 7, order: 1 },
      { id: 106, from: 2, to: 8, order: 1 },
      { id: 107, from: 2, to: 9, order: 1 },
    ];
    const result = identifyMolecule(atoms, bonds);
    expect(result).not.toBeNull();
    expect(result.name).toBe('Etanol');
  });
});

// ─── detectFunctionalGroups ───

describe('detectFunctionalGroups', () => {
  it('returns empty array for no atoms', () => {
    expect(detectFunctionalGroups([], [])).toEqual([]);
  });

  it('detects hydroxyl group (-OH)', () => {
    // C-O-H
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const o = { id: 2, element: 'O', x: 30, y: 0 };
    const h = { id: 3, element: 'H', x: 60, y: 0 };
    const atoms = [c, o, h];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 1 },
      { id: 11, from: 2, to: 3, order: 1 },
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Hidroxilo (-OH)')).toBe(true);
  });

  it('detects aldehyde group (-CHO)', () => {
    // H-C=O with H
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const o = { id: 2, element: 'O', x: 30, y: 0 };
    const h1 = { id: 3, element: 'H', x: -30, y: 0 };
    const h2 = { id: 4, element: 'H', x: 0, y: 30 };
    const atoms = [c, o, h1, h2];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 2 }, // C=O
      { id: 11, from: 1, to: 3, order: 1 }, // C-H
      { id: 12, from: 1, to: 4, order: 1 }, // C-H
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Aldehído (-CHO)')).toBe(true);
  });

  it('detects ketone group (C=O between two carbons)', () => {
    const c1 = { id: 1, element: 'C', x: 0, y: 0 };
    const c2 = { id: 2, element: 'C', x: 30, y: 0 };
    const c3 = { id: 3, element: 'C', x: 60, y: 0 };
    const o = { id: 4, element: 'O', x: 30, y: -30 };
    const atoms = [c1, c2, c3, o];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 1 }, // C-C
      { id: 11, from: 2, to: 3, order: 1 }, // C-C
      { id: 12, from: 2, to: 4, order: 2 }, // C=O
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Cetona (C=O)')).toBe(true);
  });

  it('detects carboxyl group (-COOH)', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const o1 = { id: 2, element: 'O', x: 30, y: -20 };
    const o2 = { id: 3, element: 'O', x: 30, y: 20 };
    const h = { id: 4, element: 'H', x: 60, y: 20 };
    const h2 = { id: 5, element: 'H', x: -30, y: 0 };
    const atoms = [c, o1, o2, h, h2];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 2 }, // C=O
      { id: 11, from: 1, to: 3, order: 1 }, // C-O
      { id: 12, from: 3, to: 4, order: 1 }, // O-H
      { id: 13, from: 1, to: 5, order: 1 }, // C-H
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Carboxilo (-COOH)')).toBe(true);
  });

  it('detects amino group (-NH2)', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const n = { id: 2, element: 'N', x: 30, y: 0 };
    const h1 = { id: 3, element: 'H', x: 60, y: -20 };
    const h2 = { id: 4, element: 'H', x: 60, y: 20 };
    const atoms = [c, n, h1, h2];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 1 },
      { id: 11, from: 2, to: 3, order: 1 },
      { id: 12, from: 2, to: 4, order: 1 },
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Amino (-NH₂)')).toBe(true);
  });

  it('detects ether group (C-O-C)', () => {
    const c1 = { id: 1, element: 'C', x: 0, y: 0 };
    const o = { id: 2, element: 'O', x: 30, y: 0 };
    const c2 = { id: 3, element: 'C', x: 60, y: 0 };
    const atoms = [c1, o, c2];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 1 },
      { id: 11, from: 2, to: 3, order: 1 },
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Éter (C-O-C)')).toBe(true);
  });

  it('detects amide group (-CONH-)', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const o = { id: 2, element: 'O', x: 0, y: -30 };
    const n = { id: 3, element: 'N', x: 30, y: 0 };
    const atoms = [c, o, n];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 2 }, // C=O
      { id: 11, from: 1, to: 3, order: 1 }, // C-N
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Amida (-CONH-)')).toBe(true);
  });

  it('detects ester group (-COO-)', () => {
    const c1 = { id: 1, element: 'C', x: 0, y: 0 };
    const o1 = { id: 2, element: 'O', x: 0, y: -30 };
    const o2 = { id: 3, element: 'O', x: 30, y: 0 };
    const c2 = { id: 4, element: 'C', x: 60, y: 0 };
    const atoms = [c1, o1, o2, c2];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 2 }, // C=O
      { id: 11, from: 1, to: 3, order: 1 }, // C-O
      { id: 12, from: 3, to: 4, order: 1 }, // O-C
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Éster (-COO-)')).toBe(true);
  });

  it('detects generic carbonyl when C=O has only one C neighbor', () => {
    const c1 = { id: 1, element: 'C', x: 0, y: 0 };
    const o = { id: 2, element: 'O', x: 30, y: 0 };
    const c2 = { id: 3, element: 'C', x: -30, y: 0 };
    const atoms = [c1, o, c2];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 2 }, // C=O
      { id: 11, from: 1, to: 3, order: 1 }, // C-C (only one C neighbor)
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Carbonilo (C=O)')).toBe(true);
  });

  it('does not detect hydroxyl when part of carboxyl', () => {
    // -COOH: the O-H should not also show as hydroxyl
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const o1 = { id: 2, element: 'O', x: 30, y: -20 };
    const o2 = { id: 3, element: 'O', x: 30, y: 20 };
    const h = { id: 4, element: 'H', x: 60, y: 20 };
    const h2 = { id: 5, element: 'H', x: -30, y: 0 };
    const atoms = [c, o1, o2, h, h2];
    const bonds = [
      { id: 10, from: 1, to: 2, order: 2 },
      { id: 11, from: 1, to: 3, order: 1 },
      { id: 12, from: 3, to: 4, order: 1 },
      { id: 13, from: 1, to: 5, order: 1 },
    ];
    const groups = detectFunctionalGroups(atoms, bonds);
    expect(groups.some((g) => g.name === 'Hidroxilo (-OH)')).toBe(false);
    expect(groups.some((g) => g.name === 'Carboxilo (-COOH)')).toBe(true);
  });
});

// ─── moleculeToPrompt ───

describe('moleculeToPrompt', () => {
  it('generates prompt with formula', () => {
    const atoms = [
      { id: 1, element: 'H', x: 0, y: 0 },
      { id: 2, element: 'H', x: 30, y: 0 },
      { id: 3, element: 'O', x: 60, y: 0 },
    ];
    const bonds = [
      { id: 10, from: 3, to: 1, order: 1 },
      { id: 11, from: 3, to: 2, order: 1 },
    ];
    const prompt = moleculeToPrompt(atoms, bonds);
    expect(prompt).toContain('H2O');
    expect(prompt).toContain('Agua');
  });

  it('includes bond descriptions', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const o = { id: 2, element: 'O', x: 30, y: 0 };
    const bonds = [{ id: 10, from: 1, to: 2, order: 2 }];
    const prompt = moleculeToPrompt([c, o], bonds);
    expect(prompt).toContain('enlace doble');
  });

  it('mentions triple bond', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const n = { id: 2, element: 'N', x: 30, y: 0 };
    const bonds = [{ id: 10, from: 1, to: 2, order: 3 }];
    const prompt = moleculeToPrompt([c, n], bonds);
    expect(prompt).toContain('enlace triple');
  });

  it('notes unsatisfied valences', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const prompt = moleculeToPrompt([c], []);
    expect(prompt).toContain('enlaces sin completar');
    expect(prompt).toContain('le faltan 4 enlaces');
  });

  it('notes all valences complete', () => {
    const h1 = { id: 1, element: 'H', x: 0, y: 0 };
    const h2 = { id: 2, element: 'H', x: 60, y: 0 };
    const o = { id: 3, element: 'O', x: 30, y: 0 };
    const bonds = [
      { id: 10, from: 3, to: 1, order: 1 },
      { id: 11, from: 3, to: 2, order: 1 },
    ];
    const prompt = moleculeToPrompt([h1, h2, o], bonds);
    expect(prompt).toContain('valencias completas');
  });

  it('includes functional group names', () => {
    const c = { id: 1, element: 'C', x: 0, y: 0 };
    const o = { id: 2, element: 'O', x: 30, y: 0 };
    const h = { id: 3, element: 'H', x: 60, y: 0 };
    const bonds = [
      { id: 10, from: 1, to: 2, order: 1 },
      { id: 11, from: 2, to: 3, order: 1 },
    ];
    const prompt = moleculeToPrompt([c, o, h], bonds);
    expect(prompt).toContain('Hidroxilo');
  });
});

// ─── KNOWN_MOLECULES ───

describe('KNOWN_MOLECULES', () => {
  it('has entries with required fields', () => {
    for (const mol of KNOWN_MOLECULES) {
      expect(mol).toHaveProperty('name');
      expect(mol).toHaveProperty('formula');
      expect(mol).toHaveProperty('atoms');
      expect(mol).toHaveProperty('connectivity');
    }
  });

  it('contains at least 15 molecules', () => {
    expect(KNOWN_MOLECULES.length).toBeGreaterThanOrEqual(15);
  });
});
