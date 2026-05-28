'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  canFinishMatchDirectly,
  getAdminUser,
  isNeutral,
} from '@/lib/admin-user';
import { venueMapsUrl } from '@/lib/venue-maps';
import {
  formatPlacementScore,
  isPlacementMatch,
  placementLabel,
  type MatchParticipant,
} from '@/lib/placement-match';
import { GAME_PERIODS, gamePeriodLabel } from '@chama/shared';
import { AtleticaLogo } from './AtleticaLogo';
import { IncidentPanel } from './IncidentPanel';
import { LiveMatchClock } from './LiveMatchClock';
import { ModalidadeLabel } from './ModalidadeLabel';
import type { MatchRow } from './MatchesTab';

function canOperateMatch(m: MatchRow): boolean {
  return m.canOperate !== false;
}

export function LiveScoreTab({
  matches,
  onReload,
}: {
  matches: MatchRow[];
  onReload: () => Promise<void>;
}) {
  const user = getAdminUser();
  const isNeut = isNeutral(user);
  const finishDirectly = canFinishMatchDirectly(user);
  const live = matches.filter((m) => m.status === 'live');
  const [scores, setScores] = useState<
    Record<string, { home: number; away: number }>
  >({});
  const [placements, setPlacements] = useState<
    Record<string, MatchParticipant[]>
  >({});
  const [finishTarget, setFinishTarget] = useState<MatchRow | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function getScore(m: MatchRow) {
    return scores[m.id] ?? { home: m.homeScore, away: m.awayScore };
  }

  function getParticipants(m: MatchRow): MatchParticipant[] {
    if (placements[m.id]) return placements[m.id];
    return (m.participants ?? []).map((p, i) => ({
      team: p.team,
      placement: p.placement,
      sortOrder: p.sortOrder ?? i,
    }));
  }

  async function persistScore(m: MatchRow) {
    const s = getScore(m);
    await api(`/api/admin/matches/${m.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ homeScore: s.home, awayScore: s.away }),
    });
    await onReload();
  }

  async function persistPlacements(m: MatchRow) {
    const parts = getParticipants(m);
    await api(`/api/admin/matches/${m.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        participants: parts.map((p) => ({
          team: p.team,
          placement: p.placement ?? undefined,
        })),
      }),
    });
    await onReload();
  }

  function scheduleSave(m: MatchRow, mode: 'score' | 'placement') {
    clearTimeout(saveTimers.current[m.id]);
    saveTimers.current[m.id] = setTimeout(() => {
      const fn = mode === 'placement' ? persistPlacements : persistScore;
      fn(m).catch(console.error);
    }, 450);
  }

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  function setScore(
    id: string,
    field: 'home' | 'away',
    value: number,
    base: MatchRow,
  ) {
    const current = getScore(base);
    setScores((s) => ({
      ...s,
      [id]: { ...current, [field]: Math.max(0, value) },
    }));
    scheduleSave(base, 'score');
  }

  function setPlacement(
    matchId: string,
    team: string,
    placement: number | null,
    base: MatchRow,
  ) {
    const current = getParticipants(base);
    setPlacements((prev) => ({
      ...prev,
      [matchId]: current.map((p) =>
        p.team === team ? { ...p, placement } : p,
      ),
    }));
    scheduleSave(base, 'placement');
  }

  async function finish(m: MatchRow) {
    clearTimeout(saveTimers.current[m.id]);
    const placement = isPlacementMatch(m.modalidade);

    if (!finishDirectly) {
      if (placement) {
        await persistPlacements(m);
        await api(`/api/admin/confirmations/closure-requests/${m.id}`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
      } else {
        const s = getScore(m);
        await api(`/api/admin/confirmations/closure-requests/${m.id}`, {
          method: 'POST',
          body: JSON.stringify({ homeScore: s.home, awayScore: s.away }),
        });
      }
      setFinishTarget(null);
      await onReload();
      return;
    }

    if (placement) {
      await persistPlacements(m);
      await api(`/api/admin/matches/${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'finished' }),
      });
    } else {
      const s = getScore(m);
      await api(`/api/admin/matches/${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          homeScore: s.home,
          awayScore: s.away,
          status: 'finished',
        }),
      });
    }
    setFinishTarget(null);
    await onReload();
  }

  async function unmarkLive(m: MatchRow) {
    await api(`/api/admin/matches/${m.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'scheduled' }),
    });
    await onReload();
  }

  async function setGamePeriod(m: MatchRow, gamePeriod: string | null) {
    await api(`/api/admin/matches/${m.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ gamePeriod }),
    });
    await onReload();
  }

  if (live.length === 0) {
    return (
      <div className="card">
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Nenhuma partida ao vivo no momento. Marque uma partida como{' '}
          <strong>Ao vivo</strong> na aba Partidas para operar o placar aqui.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        {isNeut
          ? 'Você vê todas as partidas ao vivo. Para alterar placar ou registrar ficha, o C.O. precisa atribuir você à partida em Confirmações.'
          : 'Mesa do C.O. da praça: o placar é salvo automaticamente ao alterar.'}
      </p>
      {live.map((m) => {
        const placement = isPlacementMatch(m.modalidade);
        const s = getScore(m);
        const parts = getParticipants(m);
        const maxPlace = parts.length;
        const label = placement
          ? `${m.division ?? m.modalidade.name} — ${parts.map((p) => p.team).join(', ')}`
          : `${m.homeTeam} x ${m.awayTeam}`;
        const operable = canOperateMatch(m);

        return (
          <div
            key={m.id}
            className="card live-score-card"
            style={operable ? undefined : { opacity: 0.92 }}
          >
            <div className="live-score-header">
              <div>
                <span className="badge badge-live">Ao vivo</span>
                <LiveMatchClock
                  liveStartedAt={m.liveStartedAt}
                  gamePeriod={m.gamePeriod}
                />
                {!operable && isNeut && (
                  <span
                    className="badge"
                    style={{ marginLeft: 6 }}
                    title="Somente visualização"
                  >
                    Somente leitura
                  </span>
                )}
                <h3 style={{ margin: '0.5rem 0 0' }}>{label}</h3>
                <small style={{ color: 'var(--muted)', display: 'block' }}>
                  <ModalidadeLabel
                    name={m.modalidade.name}
                    gender={m.modalidade.gender}
                    division={placement ? undefined : m.division}
                  />
                  {m.venue && (
                    <>
                      <br />
                      <a
                        href={venueMapsUrl(m.venue)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="venue-link"
                      >
                        {m.venue.name}
                      </a>
                      <span style={{ display: 'block', marginTop: 2 }}>
                        {m.venue.address}
                      </span>
                    </>
                  )}
                </small>
                {!placement && operable && (
                  <div className="live-period-control" style={{ marginTop: '0.5rem' }}>
                    <label
                      htmlFor={`period-${m.id}`}
                      style={{ fontSize: '0.85rem', color: 'var(--muted)' }}
                    >
                      Período do jogo
                    </label>
                    <select
                      id={`period-${m.id}`}
                      className="placement-select"
                      value={m.gamePeriod ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGamePeriod(m, v || null).catch(console.error);
                      }}
                    >
                      <option value="">—</option>
                      {GAME_PERIODS.map((p) => (
                        <option key={p} value={p}>
                          {gamePeriodLabel(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!placement && m.gamePeriod === 'interval' && (
                  <p
                    style={{
                      margin: '0.35rem 0 0',
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                    }}
                  >
                    Intervalo sinalizado — o cronômetro segue contando até o
                    regulamento definir pausa automática.
                  </p>
                )}
              </div>
              {operable && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => unmarkLive(m)}
                >
                  Desmarcar
                </button>
              )}
            </div>

            {placement ? (
              <div className="placement-board">
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Defina a colocação de cada atlética (salvo automaticamente).
                </p>
                {parts.map((p) => (
                  <div key={p.team} className="placement-row">
                    <AtleticaLogo name={p.team} size={40} />
                    <span className="placement-row-name">{p.team}</span>
                    {operable ? (
                      <select
                        className="placement-select"
                        value={p.placement ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPlacement(
                            m.id,
                            p.team,
                            v ? Number(v) : null,
                            m,
                          );
                        }}
                      >
                        <option value="">—</option>
                        {Array.from({ length: maxPlace }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {placementLabel(n)}
                            </option>
                          ),
                        )}
                      </select>
                    ) : (
                      <span className="placement-badge">
                        {p.placement ? placementLabel(p.placement) : '—'}
                      </span>
                    )}
                  </div>
                ))}
                <p className="placement-summary">
                  {formatPlacementScore(parts)}
                </p>
              </div>
            ) : (
              <div className="score-board">
                <div className="score-team">
                  <AtleticaLogo name={m.homeTeam ?? ''} size={56} />
                  <div className="score-team-name">{m.homeTeam}</div>
                  <div className="score-value">{s.home}</div>
                  {operable && (
                    <div className="score-controls">
                      <button
                        type="button"
                        className="btn-secondary btn"
                        onClick={() => setScore(m.id, 'home', s.home - 1, m)}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setScore(m.id, 'home', s.home + 1, m)}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
                <div className="score-divider">×</div>
                <div className="score-team">
                  <AtleticaLogo name={m.awayTeam ?? ''} size={56} />
                  <div className="score-team-name">{m.awayTeam}</div>
                  <div className="score-value">{s.away}</div>
                  {operable && (
                    <div className="score-controls">
                      <button
                        type="button"
                        className="btn-secondary btn"
                        onClick={() => setScore(m.id, 'away', s.away - 1, m)}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setScore(m.id, 'away', s.away + 1, m)}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {operable ? (
              <div className="live-score-actions">
                <IncidentPanel
                  matchId={m.id}
                  matchLabel={label}
                  onSaved={onReload}
                  variant="inline"
                  triggerStyle="button"
                  triggerPrimary
                  actionLabel="Registrar ficha"
                  hasIncident={(m._count?.incidents ?? 0) > 0}
                />
                <button
                  type="button"
                  className="btn-secondary btn btn-sm btn-danger-outline"
                  onClick={() => setFinishTarget(m)}
                >
                  {finishDirectly
                    ? 'Encerrar partida'
                    : 'Solicitar encerramento'}
                </button>
              </div>
            ) : (
              <p
                style={{
                  margin: '0.75rem 0 0',
                  fontSize: '0.85rem',
                  color: 'var(--muted)',
                }}
              >
                Peça ao C.O. da praça para atribuir você a esta partida em{' '}
                <strong>Confirmações</strong> se precisar operar o placar.
              </p>
            )}
          </div>
        );
      })}
      {finishTarget && (
        <ConfirmDialog
          title={finishDirectly ? 'Encerrar partida?' : 'Solicitar encerramento?'}
          message={
            finishDirectly
              ? isPlacementMatch(finishTarget.modalidade)
                ? 'As colocações registradas serão o resultado final da prova.'
                : 'Esta ação não pode ser desfeita. O placar atual será registrado como resultado final da partida.'
              : 'O C.O. da praça precisa autorizar o encerramento em Confirmações (menu lateral) antes da partida ser finalizada.'
          }
          confirmLabel={
            finishDirectly ? 'Encerrar partida' : 'Enviar solicitação'
          }
          cancelLabel="Voltar"
          danger={finishDirectly}
          onConfirm={() => finish(finishTarget)}
          onCancel={() => setFinishTarget(null)}
        />
      )}
    </div>
  );
}
