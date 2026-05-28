import { describe, expect, it } from 'vitest';
import { buildByeNote, planEliminationBracket } from './bracket-plan';

describe('buildByeNote', () => {
  it('menciona oitavas quando a folga é na primeira rodada (9 times)', () => {
    const plan = planEliminationBracket(
      Array.from({ length: 9 }, (_, i) => `T${i + 1}`),
    );
    const note = buildByeNote(plan);
    expect(note).toMatch(/Na Oitavas/);
    expect(note).toMatch(/direto na Quartas/);
  });

  it('time com folga nas oitavas entra nas quartas (13 times)', () => {
    const teams = [
      ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
      'Ilha Solteira',
    ];
    const plan = planEliminationBracket(teams);
    const oitavas = plan.rounds[0];
    const quartas = plan.rounds[1];
    const semifinal = plan.rounds[2];

    expect(oitavas?.byeTeams).toContain('Ilha Solteira');
    expect(quartas?.byeTeams).not.toContain('Ilha Solteira');

    const quartasWithIlha = quartas?.matches.find(
      (m) =>
        m.homeLabel.includes('Ilha Solteira') ||
        m.awayLabel.includes('Ilha Solteira'),
    );
    expect(quartasWithIlha).toBeDefined();

    const semiWithIlha = semifinal?.matches.some(
      (m) =>
        m.homeTeam === 'Ilha Solteira' || m.awayTeam === 'Ilha Solteira',
    );
    expect(semiWithIlha).toBe(false);
  });

  it('menciona quartas quando um vencedor aguarda na segunda rodada (10 times)', () => {
    const plan = planEliminationBracket(
      Array.from({ length: 10 }, (_, i) => `T${i + 1}`),
    );
    const note = buildByeNote(plan);
    expect(typeof note).toBe('string');
    expect(note).toMatch(/Na Quartas/);
    expect(note).toMatch(/vencedor do confronto/);
    expect(note).not.toMatch(/Na Oitavas/);
  });
});
