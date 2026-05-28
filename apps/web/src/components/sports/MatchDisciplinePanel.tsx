'use client';

import { useEffect, useState } from 'react';
import {
  MATCH_DISCIPLINE_LABELS,
  MATCH_POINTS_DEFAULTS,
  MatchDisciplineType,
  defaultPointsDeltaForDiscipline,
} from '@chama/shared';
import { api } from '@/lib/api';

type DisciplineRow = {
  id?: string;
  team: string;
  type: MatchDisciplineType;
  pointsDelta: number;
  athleteName?: string;
  minute?: number;
  notes?: string;
};

export function MatchDisciplinePanel({
  matchId,
  homeTeam,
  awayTeam,
  status,
  pointsWarning,
  onSaved,
}: {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  pointsWarning?: boolean;
  onSaved?: () => void;
}) {
  const [rows, setRows] = useState<DisciplineRow[]>([]);
  const [homePts, setHomePts] = useState<number | ''>('');
  const [awayPts, setAwayPts] = useState<number | ''>('');
  const [pointsBase, setPointsBase] = useState<number>(MATCH_POINTS_DEFAULTS.winBase);
  const [saving, setSaving] = useState(false);

  async function load() {
    const match = await api<{
      homePointsAwarded: number | null;
      awayPointsAwarded: number | null;
      pointsBase: number;
      pointsWarning: boolean;
      disciplines: DisciplineRow[];
    }>(`/api/admin/matches/${matchId}`);
    setRows(
      (match.disciplines ?? []).map((d) => ({
        team: d.team,
        type: d.type as MatchDisciplineType,
        pointsDelta: d.pointsDelta,
        athleteName: d.athleteName ?? undefined,
        minute: d.minute ?? undefined,
        notes: d.notes ?? undefined,
      })),
    );
    setHomePts(match.homePointsAwarded ?? '');
    setAwayPts(match.awayPointsAwarded ?? '');
    setPointsBase(match.pointsBase ?? MATCH_POINTS_DEFAULTS.winBase);
  }

  useEffect(() => {
    if (status === 'finished') load().catch(console.error);
  }, [matchId, status]);

  function addRow() {
    setRows((r) => [
      ...r,
      {
        team: homeTeam,
        type: MatchDisciplineType.YELLOW,
        pointsDelta: defaultPointsDeltaForDiscipline(MatchDisciplineType.YELLOW),
      },
    ]);
  }

  async function saveDisciplines() {
    setSaving(true);
    try {
      await api(`/api/admin/matches/${matchId}/disciplines`, {
        method: 'PUT',
        body: JSON.stringify({ items: rows }),
      });
      await load();
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  async function saveManualPoints() {
    if (homePts === '' || awayPts === '') return;
    setSaving(true);
    try {
      await api(`/api/admin/matches/${matchId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          homePointsAwarded: homePts,
          awayPointsAwarded: awayPts,
          pointsBase,
        }),
      });
      await load();
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  if (status !== 'finished') return null;

  return (
    <div className="card" style={{ marginTop: '0.75rem' }}>
      <h4 style={{ marginTop: 0 }}>Disciplina e pontos</h4>
      {pointsWarning && (
        <p className="badge badge-warn" style={{ display: 'block' }}>
          Atenção: pontos manuais divergem do calculado sem punição registrada.
        </p>
      )}

      <div className="form-grid form-grid-tight">
        <div>
          <label className="field-label">Pts base vitória</label>
          <input
            type="number"
            min={0}
            value={pointsBase}
            onChange={(e) => setPointsBase(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="field-label">{homeTeam} — pts</label>
          <input
            type="number"
            min={0}
            value={homePts}
            onChange={(e) =>
              setHomePts(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
        </div>
        <div>
          <label className="field-label">{awayTeam} — pts</label>
          <input
            type="number"
            min={0}
            value={awayPts}
            onChange={(e) =>
              setAwayPts(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
        </div>
      </div>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1rem' }}
        disabled={saving}
        onClick={() => saveManualPoints()}
      >
        Salvar pontos
      </button>

      {rows.map((row, i) => (
        <div key={i} className="form-grid form-grid-tight" style={{ marginBottom: 8 }}>
          <select
            value={row.team}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, team: e.target.value };
              setRows(next);
            }}
          >
            <option value={homeTeam}>{homeTeam}</option>
            <option value={awayTeam}>{awayTeam}</option>
          </select>
          <select
            value={row.type}
            onChange={(e) => {
              const type = e.target.value as MatchDisciplineType;
              const next = [...rows];
              next[i] = {
                ...row,
                type,
                pointsDelta: defaultPointsDeltaForDiscipline(type),
              };
              setRows(next);
            }}
          >
            {Object.entries(MATCH_DISCIPLINE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={row.pointsDelta}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, pointsDelta: Number(e.target.value) };
              setRows(next);
            }}
          />
          <button
            type="button"
            className="btn-link"
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
          >
            Remover
          </button>
        </div>
      ))}

      <div className="page-toolbar">
        <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>
          + Cartão / punição
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={saving}
          onClick={() => saveDisciplines()}
        >
          Salvar punições
        </button>
      </div>
    </div>
  );
}
