'use client';

import { useCallback, useEffect, useState } from 'react';
import { AtleticaDivisionTier, divisionTierLabel } from '@chama/shared';
import { api } from '@/lib/api';
import { AtleticaLogo } from './AtleticaLogo';

export type StandingRow = {
  position: number;
  team: string;
  atleticaId: string;
  division?: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

type StandingsPayload = {
  first: StandingRow[];
  second: StandingRow[];
  updatedAt?: string;
};

type DivisionRow = {
  atleticaId: string;
  division: string;
};

function StandingsTable({
  rows,
  title,
  editMode,
  divisionMap,
  onDivisionChange,
  busy,
}: {
  rows: StandingRow[];
  title: string;
  editMode: boolean;
  divisionMap: Map<string, string>;
  onDivisionChange: (atleticaId: string, division: string) => void;
  busy: boolean;
}) {
  if (!rows.length) {
    return (
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ margin: 0, color: 'var(--muted)' }}>Sem dados.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div className="table-scroll">
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Atlética</th>
              {editMode && <th>Divisão</th>}
              <th>Pts</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>SG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.atleticaId}>
                <td>{r.position}</td>
                <td>
                  <span className="standings-team">
                    <AtleticaLogo name={r.team} size={28} />
                    {r.team}
                  </span>
                </td>
                {editMode && (
                  <td>
                    <select
                      value={
                        divisionMap.get(r.atleticaId) ??
                        r.division ??
                        AtleticaDivisionTier.FIRST
                      }
                      disabled={busy}
                      onChange={(e) =>
                        onDivisionChange(r.atleticaId, e.target.value)
                      }
                    >
                      <option value={AtleticaDivisionTier.FIRST}>
                        {divisionTierLabel(AtleticaDivisionTier.FIRST)}
                      </option>
                      <option value={AtleticaDivisionTier.SECOND}>
                        {divisionTierLabel(AtleticaDivisionTier.SECOND)}
                      </option>
                    </select>
                  </td>
                )}
                <td>
                  <strong>{r.points}</strong>
                </td>
                <td>{r.played}</td>
                <td>{r.wins}</td>
                <td>{r.draws}</td>
                <td>{r.losses}</td>
                <td>
                  {r.goalDifference >= 0
                    ? `+${r.goalDifference}`
                    : r.goalDifference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StandingsTab({
  initialPayload,
  canEditDivision = false,
  onReloadStandings,
}: {
  initialPayload: StandingsPayload;
  canEditDivision?: boolean;
  onReloadStandings?: () => Promise<StandingsPayload>;
}) {
  const [data, setData] = useState(initialPayload);
  const [editMode, setEditMode] = useState(false);
  const [divisionMap, setDivisionMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setData(initialPayload);
  }, [initialPayload]);

  const reloadStandings = useCallback(async () => {
    if (onReloadStandings) {
      const fresh = await onReloadStandings();
      setData(fresh);
    }
  }, [onReloadStandings]);

  const loadDivisions = useCallback(async () => {
    const rows = await api<DivisionRow[]>('/api/admin/standings/divisions');
    setDivisionMap(new Map(rows.map((r) => [r.atleticaId, r.division])));
  }, []);

  useEffect(() => {
    if (canEditDivision) {
      loadDivisions().catch(console.error);
    }
  }, [canEditDivision, loadDivisions]);

  async function setDivision(atleticaId: string, division: string) {
    setBusy(true);
    try {
      await api('/api/admin/standings/divisions', {
        method: 'PATCH',
        body: JSON.stringify({ atleticaId, division }),
      });
      setDivisionMap((m) => new Map(m).set(atleticaId, division));
      await reloadStandings();
      setMessage('Divisão atualizada.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erro ao salvar divisão');
    } finally {
      setBusy(false);
    }
  }

  async function finishEditing() {
    setEditMode(false);
    setMessage(null);
    await reloadStandings();
  }

  const updatedLabel = data.updatedAt
    ? new Date(data.updatedAt).toLocaleString('pt-BR')
    : null;

  return (
    <div>
      <div className="page-toolbar" style={{ marginTop: 0 }}>
        <p className="page-toolbar-muted" style={{ margin: 0, flex: 1 }}>
          Classificação geral por pontos de partida (vitória base 10 pts, cartões
          descontam). Atualiza automaticamente ao finalizar jogos.
          {updatedLabel && (
            <>
              {' '}
              Última atualização: <strong>{updatedLabel}</strong>
            </>
          )}
        </p>
        {canEditDivision && (
          <button
            type="button"
            className={`btn btn-sm${editMode ? '' : ' btn-secondary'}`}
            onClick={() => {
              if (editMode) {
                finishEditing().catch(console.error);
              } else {
                setEditMode(true);
                setMessage(null);
              }
            }}
          >
            {editMode ? 'Concluir edição' : 'Editar divisões'}
          </button>
        )}
      </div>

      {message && (
        <p className="badge" style={{ display: 'block', marginBottom: '0.75rem' }}>
          {message}
        </p>
      )}

      {editMode && (
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--muted)',
            margin: '0 0 1rem',
          }}
        >
          Altere a divisão de cada atlética manualmente (mesa/criativa). As tabelas
          abaixo são reorganizadas ao salvar.
        </p>
      )}

      <StandingsTable
        title={divisionTierLabel(AtleticaDivisionTier.FIRST)}
        rows={data.first}
        editMode={editMode}
        divisionMap={divisionMap}
        onDivisionChange={setDivision}
        busy={busy}
      />
      <StandingsTable
        title={divisionTierLabel(AtleticaDivisionTier.SECOND)}
        rows={data.second}
        editMode={editMode}
        divisionMap={divisionMap}
        onDivisionChange={setDivision}
        busy={busy}
      />
    </div>
  );
}
