import { describe, expect, it } from 'vitest';
import {
  findNextPlannedMatch,
  flattenBracketPlan,
  isRealTeamMatch,
  occupiedConfrontoSlots,
  parseConfrontoNum,
} from './bracket-draw';
import { planEliminationBracket } from './bracket-plan';

describe('occupiedConfrontoSlots', () => {
  const teams = Array.from({ length: 14 }, (_, i) => `T${i + 1}`);
  const plan = planEliminationBracket(teams);

  it('conta manual sem número como slot ocupado', () => {
    const matches = [
      {
        homeTeam: 'T0',
        awayTeam: 'T1',
        bracketInfo: null,
      },
      {
        homeTeam: 'T2',
        awayTeam: 'T3',
        bracketInfo: 'Confronto 1 · T2 × T3',
      },
    ];
    const occupied = occupiedConfrontoSlots(matches, plan);
    expect(occupied.has(1)).toBe(true);
    expect(occupied.has(2)).toBe(true);
    const next = findNextPlannedMatch(plan, occupied);
    expect(next?.confronto).toBe(3);
    expect(isRealTeamMatch(next!)).toBe(true);
  });
});

describe('parseConfrontoNum', () => {
  it('lê confronto numerado', () => {
    expect(parseConfrontoNum('Confronto 4 · A × B')).toBe(4);
  });
});
