'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  AtleticaDivisionTier,
  CHALLENGE_TYPES,
  ChallengeType,
  challengeTypeLabel,
  divisionTierLabel,
} from '@chama/shared';
import { AtleticaLogo } from '@/components/sports/AtleticaLogo';
import { hasFullAccess, useAdminUser } from '@/lib/admin-user';

type Challenge = {
  id: string;
  title: string;
  challengeType: string | null;
  scheduledAt: string;
  locationName: string;
  address?: string | null;
  description?: string | null;
};

type DivisionRow = {
  id: string;
  atleticaId: string;
  team: string;
  atleticaName: string;
  division: string;
};

export default function ChallengesPage() {
  const user = useAdminUser();
  const canEdit = hasFullAccess(user);
  const [activeType, setActiveType] = useState<ChallengeType>(
    ChallengeType.BATTERY,
  );
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [divisions, setDivisions] = useState<DivisionRow[]>([]);
  const [divisionMap, setDivisionMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [editDivisions, setEditDivisions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savingAtleticaId, setSavingAtleticaId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    scheduledAt: '',
    locationName: '',
    address: '',
    description: '',
  });

  const load = useCallback(async () => {
    const [challenges, divs] = await Promise.all([
      api<Challenge[]>('/api/admin/challenges'),
      api<DivisionRow[]>(
        `/api/admin/challenges/divisions?type=${activeType}`,
      ),
    ]);
    const found =
      challenges.find((c) => c.challengeType === activeType) ?? null;
    setChallenge(found);
    setDivisions(divs);
    setDivisionMap(new Map(divs.map((d) => [d.atleticaId, d.division])));
    if (found) {
      setEventForm({
        scheduledAt: found.scheduledAt.slice(0, 16),
        locationName: found.locationName,
        address: found.address ?? '',
        description: found.description ?? '',
      });
    } else {
      setEventForm({
        scheduledAt: '',
        locationName: '',
        address: '',
        description: '',
      });
    }
  }, [activeType]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/admin/challenges/event', {
        method: 'PUT',
        body: JSON.stringify({
          challengeType: activeType,
          title: challengeTypeLabel(activeType),
          scheduledAt: new Date(eventForm.scheduledAt).toISOString(),
          locationName: eventForm.locationName,
          address: eventForm.address || undefined,
          description: eventForm.description || undefined,
        }),
      });
      setMessage('Agenda do desafio salva.');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setBusy(false);
    }
  }

  async function setDivision(atleticaId: string, division: string) {
    setSavingAtleticaId(atleticaId);
    try {
      await api('/api/admin/challenges/divisions', {
        method: 'PATCH',
        body: JSON.stringify({
          atleticaId,
          challengeType: activeType,
          division,
        }),
      });
      setDivisionMap((m) => new Map(m).set(atleticaId, division));
      setDivisions((rows) =>
        rows.map((r) =>
          r.atleticaId === atleticaId ? { ...r, division } : r,
        ),
      );
      setMessage('Divisão atualizada.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao salvar divisão');
    } finally {
      setSavingAtleticaId(null);
    }
  }

  async function finishDivisionEdit() {
    setEditDivisions(false);
    setMessage(null);
    await load();
  }

  const resolveDivision = (atleticaId: string, fallback: string) =>
    divisionMap.get(atleticaId) ?? fallback;

  const firstDiv = divisions.filter(
    (d) => resolveDivision(d.atleticaId, d.division) === AtleticaDivisionTier.FIRST,
  );
  const secondDiv = divisions.filter(
    (d) => resolveDivision(d.atleticaId, d.division) === AtleticaDivisionTier.SECOND,
  );

  return (
    <div>
      <h1>Desafios</h1>
      <p className="page-intro">
        Baterias e cheer com divisões próprias (independentes do esporte). A
        classificação por pontos será preenchida conforme o regulamento de cada
        desafio.
      </p>

      <div className="tabs">
        {CHALLENGE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`tab ${activeType === type ? 'active' : ''}`}
            onClick={() => {
              setActiveType(type);
              setEditDivisions(false);
              setMessage(null);
            }}
          >
            {challengeTypeLabel(type)}
          </button>
        ))}
      </div>

      {message && (
        <p className="badge" style={{ display: 'block', margin: '0.75rem 0' }}>
          {message}
        </p>
      )}

      {canEdit && (
        <form className="card" onSubmit={saveEvent} style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>
            Agenda — {challengeTypeLabel(activeType)}
          </h3>
          <div className="form-grid">
            <input
              type="datetime-local"
              required
              value={eventForm.scheduledAt}
              onChange={(e) =>
                setEventForm({ ...eventForm, scheduledAt: e.target.value })
              }
            />
            <input
              placeholder="Local do desafio"
              required
              value={eventForm.locationName}
              onChange={(e) =>
                setEventForm({ ...eventForm, locationName: e.target.value })
              }
            />
            <input
              placeholder="Endereço (opcional)"
              value={eventForm.address}
              onChange={(e) =>
                setEventForm({ ...eventForm, address: e.target.value })
              }
            />
          </div>
          <textarea
            placeholder="Descrição / observações"
            rows={2}
            style={{ marginTop: '0.5rem', width: '100%' }}
            value={eventForm.description}
            onChange={(e) =>
              setEventForm({ ...eventForm, description: e.target.value })
            }
          />
          <button
            type="submit"
            className="btn btn-sm"
            style={{ marginTop: '0.5rem' }}
            disabled={busy}
          >
            Salvar agenda
          </button>
        </form>
      )}

      {!canEdit && challenge && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>{challenge.title}</h3>
          <p style={{ margin: 0 }}>
            {new Date(challenge.scheduledAt).toLocaleString('pt-BR')} —{' '}
            {challenge.locationName}
          </p>
          {challenge.description && (
            <p style={{ color: 'var(--muted)' }}>{challenge.description}</p>
          )}
        </div>
      )}

      <div className="card">
        <div className="page-toolbar">
          <h3 style={{ margin: 0 }}>
            Divisões e classificação — {challengeTypeLabel(activeType)}
          </h3>
          {canEdit && (
            <button
              type="button"
              className={`btn btn-sm${editDivisions ? '' : ' btn-secondary'}`}
              onClick={() => {
                if (editDivisions) {
                  finishDivisionEdit().catch(console.error);
                } else {
                  setEditDivisions(true);
                  setMessage(null);
                }
              }}
            >
              {editDivisions ? 'Concluir edição' : 'Editar divisões'}
            </button>
          )}
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          Divisões exclusivas deste desafio. Não alteram a classificação
          esportiva nem a divisão do outro desafio.
        </p>

        <StandingsBlock
          title={divisionTierLabel(AtleticaDivisionTier.FIRST)}
          rows={firstDiv}
          editMode={editDivisions && canEdit}
          onChange={setDivision}
          divisionMap={divisionMap}
          savingAtleticaId={savingAtleticaId}
        />
        <StandingsBlock
          title={divisionTierLabel(AtleticaDivisionTier.SECOND)}
          rows={secondDiv}
          editMode={editDivisions && canEdit}
          onChange={setDivision}
          divisionMap={divisionMap}
          savingAtleticaId={savingAtleticaId}
        />
      </div>
    </div>
  );
}

function StandingsBlock({
  title,
  rows,
  editMode,
  onChange,
  divisionMap,
  savingAtleticaId,
}: {
  title: string;
  rows: DivisionRow[];
  editMode: boolean;
  onChange: (atleticaId: string, division: string) => void;
  divisionMap: Map<string, string>;
  savingAtleticaId: string | null;
}) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{ margin: '0 0 0.5rem' }}>{title}</h4>
      {rows.length === 0 ? (
        <p style={{ color: 'var(--muted)', margin: 0 }}>Nenhuma atlética.</p>
      ) : (
        <div className="table-scroll">
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Atlética</th>
                {editMode && <th>Divisão</th>}
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, index) => (
                <tr key={r.id}>
                  <td>{index + 1}</td>
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
                          divisionMap.get(r.atleticaId) ?? r.division
                        }
                        disabled={savingAtleticaId === r.atleticaId}
                        onChange={(e) =>
                          onChange(r.atleticaId, e.target.value)
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
                    <strong>0</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
