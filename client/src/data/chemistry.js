// ─── Elements with CPK colors and max valence ───

export const ELEMENTS = {
  C:  { symbol: 'C',  name: 'Carbono',  maxBonds: 4, color: '#333333', textColor: '#ffffff', radius: 22, atomicNumber: 6,  neutrons: 6,  electronShells: [2, 4] },
  H:  { symbol: 'H',  name: 'Hidrógeno', maxBonds: 1, color: '#ffffff', textColor: '#333333', radius: 14, atomicNumber: 1,  neutrons: 0,  electronShells: [1] },
  O:  { symbol: 'O',  name: 'Oxígeno',  maxBonds: 2, color: '#ff0d0d', textColor: '#ffffff', radius: 18, atomicNumber: 8,  neutrons: 8,  electronShells: [2, 6] },
  N:  { symbol: 'N',  name: 'Nitrógeno', maxBonds: 3, color: '#3050f8', textColor: '#ffffff', radius: 18, atomicNumber: 7,  neutrons: 7,  electronShells: [2, 5] },
  S:  { symbol: 'S',  name: 'Azufre',   maxBonds: 2, color: '#ffff30', textColor: '#333333', radius: 20, atomicNumber: 16, neutrons: 16, electronShells: [2, 8, 6] },
  P:  { symbol: 'P',  name: 'Fósforo',  maxBonds: 3, color: '#ff8000', textColor: '#ffffff', radius: 20, atomicNumber: 15, neutrons: 16, electronShells: [2, 8, 5] },
  F:  { symbol: 'F',  name: 'Flúor',    maxBonds: 1, color: '#90e050', textColor: '#333333', radius: 16, atomicNumber: 9,  neutrons: 10, electronShells: [2, 7] },
  Cl: { symbol: 'Cl', name: 'Cloro',    maxBonds: 1, color: '#1ff01f', textColor: '#333333', radius: 18, atomicNumber: 17, neutrons: 18, electronShells: [2, 8, 7] },
  Br: { symbol: 'Br', name: 'Bromo',    maxBonds: 1, color: '#a62929', textColor: '#ffffff', radius: 20, atomicNumber: 35, neutrons: 45, electronShells: [2, 8, 18, 7] },
  I:  { symbol: 'I',  name: 'Yodo',     maxBonds: 1, color: '#940094', textColor: '#ffffff', radius: 20, atomicNumber: 53, neutrons: 74, electronShells: [2, 8, 18, 18, 7] },
};

// ─── Bond helpers ───

export function currentBondCount(atomId, bonds) {
  let count = 0;
  for (const b of bonds) {
    if (b.from === atomId || b.to === atomId) count += b.order;
  }
  return count;
}

export function remainingBonds(atom, atoms, bonds) {
  const el = ELEMENTS[atom.element];
  if (!el) return 0;
  return el.maxBonds - currentBondCount(atom.id, bonds);
}

export function canBond(atomA, atomB, atoms, bonds) {
  if (atomA.id === atomB.id) return false;
  // Already bonded?
  const existing = bonds.find(
    (b) => (b.from === atomA.id && b.to === atomB.id) || (b.from === atomB.id && b.to === atomA.id)
  );
  if (existing) return false;
  return remainingBonds(atomA, atoms, bonds) >= 1 && remainingBonds(atomB, atoms, bonds) >= 1;
}

export function canIncreaseBondOrder(bond, atoms, bonds) {
  const atomA = atoms.find((a) => a.id === bond.from);
  const atomB = atoms.find((a) => a.id === bond.to);
  if (!atomA || !atomB) return false;
  if (bond.order >= 3) return false;
  // Check remaining capacity excluding this bond's current contribution
  const elA = ELEMENTS[atomA.element];
  const elB = ELEMENTS[atomB.element];
  const usedA = currentBondCount(atomA.id, bonds);
  const usedB = currentBondCount(atomB.id, bonds);
  return usedA < elA.maxBonds && usedB < elB.maxBonds;
}

export function getNeighbors(atomId, atoms, bonds) {
  const neighbors = [];
  for (const b of bonds) {
    if (b.from === atomId) neighbors.push({ atom: atoms.find((a) => a.id === b.to), bond: b });
    if (b.to === atomId) neighbors.push({ atom: atoms.find((a) => a.id === b.from), bond: b });
  }
  return neighbors;
}

// ─── Functional group detection ───

function hasPattern(atomId, atoms, bonds, pattern) {
  // pattern: array of { element, bondOrder } describing neighbors
  const neighbors = getNeighbors(atomId, atoms, bonds);
  const remaining = [...pattern];
  for (const n of neighbors) {
    if (!n.atom) continue;
    const idx = remaining.findIndex((p) => p.element === n.atom.element && p.bondOrder === n.bond.order);
    if (idx !== -1) remaining.splice(idx, 1);
  }
  return remaining.length === 0;
}

export function detectFunctionalGroups(atoms, bonds) {
  const groups = [];

  for (const atom of atoms) {
    const neighbors = getNeighbors(atom.id, atoms, bonds);

    // ─ Hydroxyl (-OH): O bonded to 1 H and 1 C (single bonds)
    if (atom.element === 'O') {
      const hNeighbors = neighbors.filter((n) => n.atom?.element === 'H' && n.bond.order === 1);
      const cNeighbors = neighbors.filter((n) => n.atom?.element === 'C' && n.bond.order === 1);
      if (hNeighbors.length === 1 && cNeighbors.length === 1) {
        // Check it's not part of carboxyl
        const carbonNeighbors = getNeighbors(cNeighbors[0].atom.id, atoms, bonds);
        const hasDoubleBondO = carbonNeighbors.some(
          (cn) => cn.atom?.element === 'O' && cn.bond.order === 2
        );
        if (!hasDoubleBondO) {
          groups.push({
            name: 'Hidroxilo (-OH)',
            atomIds: [atom.id, hNeighbors[0].atom.id],
            center: atom,
          });
        }
      }
    }

    // ─ Carbonyl (C=O): C double-bonded to O
    if (atom.element === 'C') {
      const doubleBondO = neighbors.filter((n) => n.atom?.element === 'O' && n.bond.order === 2);
      if (doubleBondO.length === 1) {
        const singleBondOH = neighbors.filter((n) => {
          if (n.atom?.element !== 'O' || n.bond.order !== 1) return false;
          const oNeighbors = getNeighbors(n.atom.id, atoms, bonds);
          return oNeighbors.some((on) => on.atom?.element === 'H');
        });
        const cNeighbors = neighbors.filter((n) => n.atom?.element === 'C' && n.bond.order === 1);
        const hNeighbors = neighbors.filter((n) => n.atom?.element === 'H' && n.bond.order === 1);

        if (singleBondOH.length === 1) {
          // Carboxyl (-COOH)
          const ohAtom = singleBondOH[0].atom;
          const hOfOH = getNeighbors(ohAtom.id, atoms, bonds).find((n) => n.atom?.element === 'H');
          groups.push({
            name: 'Carboxilo (-COOH)',
            atomIds: [atom.id, doubleBondO[0].atom.id, ohAtom.id, ...(hOfOH ? [hOfOH.atom.id] : [])],
            center: atom,
          });
        } else if (hNeighbors.length >= 1 && cNeighbors.length === 0) {
          // Aldehyde (-CHO): C=O with at least one H, no C neighbors besides possibly another H
          groups.push({
            name: 'Aldehído (-CHO)',
            atomIds: [atom.id, doubleBondO[0].atom.id, hNeighbors[0].atom.id],
            center: atom,
          });
        } else if (cNeighbors.length === 2) {
          // Ketone (C-CO-C)
          groups.push({
            name: 'Cetona (C=O)',
            atomIds: [atom.id, doubleBondO[0].atom.id],
            center: atom,
          });
        } else {
          // Generic carbonyl
          groups.push({
            name: 'Carbonilo (C=O)',
            atomIds: [atom.id, doubleBondO[0].atom.id],
            center: atom,
          });
        }
      }
    }

    // ─ Amino (-NH₂): N bonded to 2 H and 1 C
    if (atom.element === 'N') {
      const hNeighbors = neighbors.filter((n) => n.atom?.element === 'H' && n.bond.order === 1);
      const cNeighbors = neighbors.filter((n) => n.atom?.element === 'C' && n.bond.order === 1);
      if (hNeighbors.length === 2 && cNeighbors.length === 1) {
        groups.push({
          name: 'Amino (-NH₂)',
          atomIds: [atom.id, ...hNeighbors.map((n) => n.atom.id)],
          center: atom,
        });
      }
    }

    // ─ Ether (C-O-C): O bonded to 2 C
    if (atom.element === 'O') {
      const cNeighbors = neighbors.filter((n) => n.atom?.element === 'C' && n.bond.order === 1);
      if (cNeighbors.length === 2) {
        groups.push({
          name: 'Éter (C-O-C)',
          atomIds: [atom.id, ...cNeighbors.map((n) => n.atom.id)],
          center: atom,
        });
      }
    }

    // ─ Ester (C-COO-C): C with C=O and C-O-C
    if (atom.element === 'C') {
      const doubleBondO = neighbors.filter((n) => n.atom?.element === 'O' && n.bond.order === 2);
      const singleBondO = neighbors.filter((n) => {
        if (n.atom?.element !== 'O' || n.bond.order !== 1) return false;
        const oNeighbors = getNeighbors(n.atom.id, atoms, bonds);
        return oNeighbors.some((on) => on.atom?.element === 'C' && on.atom.id !== atom.id);
      });
      if (doubleBondO.length === 1 && singleBondO.length === 1) {
        // Only if not already carboxyl
        const oNeighbors = getNeighbors(singleBondO[0].atom.id, atoms, bonds);
        const hasH = oNeighbors.some((on) => on.atom?.element === 'H');
        if (!hasH) {
          groups.push({
            name: 'Éster (-COO-)',
            atomIds: [atom.id, doubleBondO[0].atom.id, singleBondO[0].atom.id],
            center: atom,
          });
        }
      }
    }

    // ─ Amide (C(=O)-N): C with C=O and C-N
    if (atom.element === 'C') {
      const doubleBondO = neighbors.filter((n) => n.atom?.element === 'O' && n.bond.order === 2);
      const singleBondN = neighbors.filter((n) => n.atom?.element === 'N' && n.bond.order === 1);
      if (doubleBondO.length === 1 && singleBondN.length === 1) {
        groups.push({
          name: 'Amida (-CONH-)',
          atomIds: [atom.id, doubleBondO[0].atom.id, singleBondN[0].atom.id],
          center: atom,
        });
      }
    }
  }

  // Deduplicate by checking overlapping atomIds
  const unique = [];
  for (const g of groups) {
    const dominated = unique.findIndex((u) => {
      const uSet = new Set(u.atomIds);
      return g.atomIds.every((id) => uSet.has(id)) && u.atomIds.length > g.atomIds.length;
    });
    // If the new group is a subset of an existing one, skip it
    const isSubset = unique.some((u) => {
      const uSet = new Set(u.atomIds);
      return g.atomIds.every((id) => uSet.has(id)) && u.atomIds.length >= g.atomIds.length;
    });
    if (!isSubset) {
      // Remove any existing groups that are subsets of the new one
      const gSet = new Set(g.atomIds);
      for (let i = unique.length - 1; i >= 0; i--) {
        if (unique[i].atomIds.every((id) => gSet.has(id)) && unique[i].atomIds.length < g.atomIds.length) {
          unique.splice(i, 1);
        }
      }
      unique.push(g);
    }
  }

  return unique;
}

// ─── Build molecular formula ───

export function buildFormula(atoms) {
  const counts = {};
  for (const a of atoms) {
    counts[a.element] = (counts[a.element] || 0) + 1;
  }
  // Hill order: C first, H second, then alphabetical
  const order = [];
  if (counts.C) { order.push('C'); delete counts.C; }
  if (counts.H) { order.push('H'); delete counts.H; }
  const rest = Object.keys(counts).sort();
  order.push(...rest);

  // Rebuild counts
  const allCounts = {};
  for (const a of atoms) {
    allCounts[a.element] = (allCounts[a.element] || 0) + 1;
  }

  let formula = '';
  for (const el of order) {
    formula += el;
    if (allCounts[el] > 1) formula += allCounts[el];
  }
  return formula;
}

// ─── Known molecules database ───

export const KNOWN_MOLECULES = [
  { name: 'Agua', formula: 'H2O', atoms: { H: 2, O: 1 }, connectivity: 'O-H,O-H' },
  { name: 'Metano', formula: 'CH4', atoms: { C: 1, H: 4 }, connectivity: 'C-H,C-H,C-H,C-H' },
  { name: 'Metanol', formula: 'CH4O', atoms: { C: 1, H: 4, O: 1 }, connectivity: 'C-O,O-H' },
  { name: 'Etanol', formula: 'C2H6O', atoms: { C: 2, H: 6, O: 1 }, connectivity: 'C-C,C-O,O-H' },
  { name: 'Ácido fórmico', formula: 'CH2O2', atoms: { C: 1, H: 2, O: 2 }, connectivity: 'C=O,C-O,O-H' },
  { name: 'Ácido acético', formula: 'C2H4O2', atoms: { C: 2, H: 4, O: 2 }, connectivity: 'C-C,C=O,C-O,O-H' },
  { name: 'Formaldehído', formula: 'CH2O', atoms: { C: 1, H: 2, O: 1 }, connectivity: 'C=O,C-H,C-H' },
  { name: 'Acetona', formula: 'C3H6O', atoms: { C: 3, H: 6, O: 1 }, connectivity: 'C-C,C-C,C=O' },
  { name: 'Etilamina', formula: 'C2H7N', atoms: { C: 2, H: 7, N: 1 }, connectivity: 'C-C,C-N,N-H,N-H' },
  { name: 'Dimetiléter', formula: 'C2H6O', atoms: { C: 2, H: 6, O: 1 }, connectivity: 'C-O,C-O' },
  { name: 'Eteno (Etileno)', formula: 'C2H4', atoms: { C: 2, H: 4 }, connectivity: 'C=C' },
  { name: 'Etino (Acetileno)', formula: 'C2H2', atoms: { C: 2, H: 2 }, connectivity: 'C≡C' },
  { name: 'Amoníaco', formula: 'H3N', atoms: { H: 3, N: 1 }, connectivity: 'N-H,N-H,N-H' },
  { name: 'Ácido cianhídrico', formula: 'CHN', atoms: { C: 1, H: 1, N: 1 }, connectivity: 'C≡N,C-H' },
  { name: 'Peróxido de hidrógeno', formula: 'H2O2', atoms: { H: 2, O: 2 }, connectivity: 'O-O,O-H,O-H' },
  { name: 'Metilamina', formula: 'CH5N', atoms: { C: 1, H: 5, N: 1 }, connectivity: 'C-N,N-H,N-H' },
  { name: 'Etano', formula: 'C2H6', atoms: { C: 2, H: 6 }, connectivity: 'C-C' },
  { name: 'Propano', formula: 'C3H8', atoms: { C: 3, H: 8 }, connectivity: 'C-C,C-C' },
  { name: 'Glicina', formula: 'C2H5NO2', atoms: { C: 2, H: 5, N: 1, O: 2 }, connectivity: 'C-C,C=O,C-O,O-H,C-N,N-H,N-H' },
];

function buildConnectivity(atoms, bonds) {
  const parts = [];
  for (const b of bonds) {
    const a1 = atoms.find((a) => a.id === b.from);
    const a2 = atoms.find((a) => a.id === b.to);
    if (!a1 || !a2) continue;
    const els = [a1.element, a2.element].sort();
    const sep = b.order === 3 ? '≡' : b.order === 2 ? '=' : '-';
    parts.push(`${els[0]}${sep}${els[1]}`);
  }
  return parts.sort().join(',');
}

function buildAtomCounts(atoms) {
  const counts = {};
  for (const a of atoms) {
    counts[a.element] = (counts[a.element] || 0) + 1;
  }
  return counts;
}

export function identifyMolecule(atoms, bonds) {
  if (atoms.length === 0) return null;
  const formula = buildFormula(atoms);
  const atomCounts = buildAtomCounts(atoms);
  const connectivity = buildConnectivity(atoms, bonds);

  // First match by formula, then refine by connectivity
  const candidates = KNOWN_MOLECULES.filter((m) => m.formula === formula);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Multiple candidates with same formula - match by connectivity
  for (const c of candidates) {
    if (c.connectivity === connectivity) return c;
  }
  return candidates[0]; // Fallback to first match
}

// ─── Prompt builder for AI chat ───

export function moleculeToPrompt(atoms, bonds) {
  const formula = buildFormula(atoms);
  const groups = detectFunctionalGroups(atoms, bonds);
  const molecule = identifyMolecule(atoms, bonds);

  // Describe the connectivity
  const bondDescriptions = bonds.map((b) => {
    const a1 = atoms.find((a) => a.id === b.from);
    const a2 = atoms.find((a) => a.id === b.to);
    if (!a1 || !a2) return null;
    const orderLabel = b.order === 3 ? 'triple' : b.order === 2 ? 'doble' : 'simple';
    return `${a1.element}-${a2.element} (enlace ${orderLabel})`;
  }).filter(Boolean);

  // Find atoms with unsatisfied valences
  const unsatisfied = atoms.filter((a) => remainingBonds(a, atoms, bonds) > 0);

  let prompt = `Soy estudiante aprendiendo química. He construido una molécula con fórmula ${formula}`;
  if (molecule) {
    prompt += `, que corresponde a ${molecule.name}`;
  }
  prompt += '.';

  if (bondDescriptions.length > 0) {
    prompt += ` Los enlaces son: ${bondDescriptions.join(', ')}.`;
  }

  if (groups.length > 0) {
    const groupNames = groups.map((g) => g.name).join(', ');
    prompt += ` He formado estos grupos funcionales: ${groupNames}.`;
  }

  if (unsatisfied.length > 0) {
    const details = unsatisfied.map((a) => {
      const rem = remainingBonds(a, atoms, bonds);
      return `${a.element} (le faltan ${rem} enlace${rem > 1 ? 's' : ''})`;
    });
    prompt += ` NOTA: hay átomos con enlaces sin completar: ${details.join(', ')}.`;
    prompt += ' Explícame si mi estructura es correcta, qué le falta, y cómo debería completarla.';
  } else {
    prompt += ' Todos los átomos tienen sus valencias completas.';
  }

  prompt += ' Explica de forma didáctica: 1) ¿Es válida esta molécula? 2) ¿Qué propiedades tiene? 3) ¿Qué grupos funcionales tiene y por qué son importantes? 4) ¿Para qué se usa en la vida real?';
  return prompt;
}
