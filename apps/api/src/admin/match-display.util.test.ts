import { describe, expect, it } from 'vitest';
import {
  formatBracketMatchBotLine,
  formatMatchTeamsLabel,
} from './match-display.util';

const baseMod = {
  slug: 'basquete',
  scoringMode: 'points',
};

describe('formatBracketMatchBotLine', () => {
  it('não repete times quando home e away estão definidos', () => {
    const line = formatBracketMatchBotLine({
      homeTeam: 'Araçatuba',
      awayTeam: 'Presidente Prudente',
      bracketInfo: 'Confronto 2 · Araçatuba × Presidente Prudente',
      homeScore: 0,
      awayScore: 0,
      modalidade: baseMod,
    });
    expect(line).toBe('Araçatuba x Presidente Prudente _(Confronto 2)_');
    expect(line).not.toContain('Araçatuba × Presidente Prudente');
  });

  it('formata placeholder sem duplicar', () => {
    const line = formatBracketMatchBotLine({
      homeTeam: null,
      awayTeam: null,
      bracketInfo:
        'Confronto 8 · Vencedor confronto 1 × Vencedor confronto 2',
      homeScore: 0,
      awayScore: 0,
      modalidade: baseMod,
    });
    expect(line).toBe(
      'Confronto 8 · Vencedor confronto 1 × Vencedor confronto 2',
    );
    expect(formatMatchTeamsLabel({
      homeTeam: null,
      awayTeam: null,
      bracketInfo:
        'Confronto 8 · Vencedor confronto 1 × Vencedor confronto 2',
      homeScore: 0,
      awayScore: 0,
      modalidade: baseMod,
    })).toBe('Vencedor confronto 1 × Vencedor confronto 2');
  });
});
