'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  getAdminUser,
  hasFullAccess,
  isNeutral,
  isVenueCoordinator,
} from '@/lib/admin-user';
import { STATUS_LABELS } from '@/lib/sports-labels';
import {
  formatPlacementScore,
  isPlacementMatch,
} from '@/lib/placement-match';
import { MatchTeams, MatchParticipantsList } from './AtleticaLogo';
import type { MatchRow } from './MatchesTab';

type NeutralUser = { id: string; name: string; email: string };

type CoordinatorUser = NeutralUser & {
  venueId?: string | null;
  venue?: { id: string; name: string } | null;
};

type VenueAuthorization = {
  id: string;
  createdAt: string;
  coordinator: NeutralUser;
  venue: { id: string; name: string };
  authorizedBy: { id: string; name: string };
};

type ClosureRequest = {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
  match: MatchRow;
  requestedBy?: { id: string; name: string; email: string };
  reviewedBy?: { id: string; name: string } | null;
};

type Assignment = {
  id: string;
  match: MatchRow;
  adminUser: NeutralUser;
  assignedBy: { id: string; name: string };
};

type ConfirmationsData = {
  closureRequests: ClosureRequest[];
  assignments: Assignment[];
  neutrals?: NeutralUser[];
  coordinators?: CoordinatorUser[];
  venueAuthorizations?: VenueAuthorization[];
  venueAuthorized?: boolean;
};

export function ConfirmationsTab({
  matches,
  onReload,
}: {
  matches: MatchRow[];
  onReload: () => Promise<void>;
}) {
  const user = getAdminUser();
  const isCo = isVenueCoordinator(user);
  const isNeut = isNeutral(user);
  const canManage = isCo || hasFullAccess(user);

  const [data, setData] = useState<ConfirmationsData | null>(null);
  const [assignMatchId, setAssignMatchId] = useState('');
  const [assignNeutralId, setAssignNeutralId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<ConfirmationsData>('/api/admin/confirmations');
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  async function approve(id: string) {
    await api(`/api/admin/confirmations/closure-requests/${id}/approve`, {
      method: 'PATCH',
    });
    await Promise.all([load(), onReload()]);
  }

  async function reject(id: string) {
    await api(`/api/admin/confirmations/closure-requests/${id}/reject`, {
      method: 'PATCH',
    });
    await load();
  }

  async function assignNeutral(e: React.FormEvent) {
    e.preventDefault();
    if (!assignMatchId || !assignNeutralId) return;
    await api('/api/admin/confirmations/assignments', {
      method: 'POST',
      body: JSON.stringify({
        matchId: assignMatchId,
        neutralUserId: assignNeutralId,
      }),
    });
    setAssignMatchId('');
    setAssignNeutralId('');
    await load();
  }

  async function revokeAssignment(id: string) {
    await api(`/api/admin/confirmations/assignments/${id}`, {
      method: 'DELETE',
    });
    await load();
  }

  async function authorizeCoordinator(coordinatorId: string) {
    await api('/api/admin/confirmations/venue-authorizations', {
      method: 'POST',
      body: JSON.stringify({ coordinatorId }),
    });
    await load();
  }

  async function revokeVenueAuthorization(id: string) {
    await api(`/api/admin/confirmations/venue-authorizations/${id}`, {
      method: 'DELETE',
    });
    await load();
  }

  if (loading && !data) {
    return (
      <div className="card">
        <p style={{ margin: 0, color: 'var(--muted)' }}>Carregando…</p>
      </div>
    );
  }

  const pending = data?.closureRequests ?? [];
  const assignments = data?.assignments ?? [];
  const neutrals = data?.neutrals ?? [];
  const coordinators = data?.coordinators ?? [];
  const venueAuthorizations = data?.venueAuthorizations ?? [];
  const venueAuthorized = data?.venueAuthorized ?? true;
  const authorizedCoordinatorIds = new Set(
    venueAuthorizations.map((a) => a.coordinator.id),
  );
  const pendingCoordinators = coordinators.filter(
    (c) => !authorizedCoordinatorIds.has(c.id),
  );

  if (isNeut) {
    return (
      <div>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>
          Acompanhe suas solicitações de encerramento. O C.O. da praça precisa
          aprovar antes da partida ser finalizada.
        </p>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Suas solicitações</h3>
          {pending.length === 0 && (
            <p style={{ color: 'var(--muted)' }}>
              Nenhuma solicitação registrada.
            </p>
          )}
          {pending.map((r) => (
            <div
              key={r.id}
              style={{
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {isPlacementMatch(r.match.modalidade) ? (
                <>
                  {r.match.division && (
                    <strong style={{ display: 'block' }}>{r.match.division}</strong>
                  )}
                  <MatchParticipantsList participants={r.match.participants ?? []} />
                </>
              ) : (
                <MatchTeams
                  homeTeam={r.match.homeTeam}
                  awayTeam={r.match.awayTeam}
                />
              )}
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                {isPlacementMatch(r.match.modalidade)
                  ? `Colocações: ${formatPlacementScore(r.match.participants)}`
                  : `Placar solicitado: ${r.homeScore} x ${r.awayScore}`}
              </p>
              <span className="badge">{STATUS_LABELS[r.status] ?? r.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!canManage) return null;

  const assignableMatches = matches.filter((m) => m.status !== 'finished');

  return (
    <div>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Autorize encerramentos solicitados por neutros, libere C.O. da praça
        para operar e defina quais partidas cada neutro pode operar.
      </p>

      {hasFullAccess(user) && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Autorizar C.O. da praça</h3>
          <p style={{ color: 'var(--muted)', marginTop: 0, fontSize: '0.9rem' }}>
            O C.O. da praça só pode atribuir neutros após autorização do
            Diretor C.O., Mesa ou Criativa.
          </p>
          {pendingCoordinators.length === 0 && venueAuthorizations.length === 0 ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              Nenhum C.O. da praça cadastrado.
            </p>
          ) : (
            <>
              {pendingCoordinators.map((c) => (
                <div key={c.id} className="action-row">
                  <div>
                    <strong>{c.name}</strong>
                    <p style={{ margin: '0.25rem 0', color: 'var(--muted)' }}>
                      {c.venue?.name ?? 'Sem praça vinculada'} · {c.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => authorizeCoordinator(c.id)}
                    disabled={!c.venueId}
                  >
                    Autorizar praça
                  </button>
                </div>
              ))}
              {venueAuthorizations.length > 0 && (
                <>
                  <h4 style={{ marginBottom: '0.5rem' }}>Autorizados</h4>
                  {venueAuthorizations.map((a) => (
                    <div key={a.id} className="action-row">
                      <div>
                        <strong>{a.coordinator.name}</strong>
                        <p style={{ margin: '0.25rem 0', color: 'var(--muted)' }}>
                          {a.venue.name} · autorizado por {a.authorizedBy.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => revokeVenueAuthorization(a.id)}
                      >
                        Revogar
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {isCo && !venueAuthorized && (
        <div
          className="card"
          style={{ marginBottom: '1.5rem', borderColor: 'var(--warning, #c9a227)' }}
        >
          <h3 style={{ marginTop: 0 }}>Aguardando autorização</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Peça ao Diretor C.O., Mesa ou Criativa para autorizar sua praça
            antes de atribuir neutros às partidas.
          </p>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>
          Solicitações de encerramento
          {pending.length > 0 && (
            <span className="badge badge-live" style={{ marginLeft: 8 }}>
              {pending.length}
            </span>
          )}
        </h3>
        {pending.length === 0 ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Nenhuma solicitação pendente.
          </p>
        ) : (
          pending.map((r) => (
            <div
              key={r.id}
              style={{
                padding: '1rem 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {isPlacementMatch(r.match.modalidade) ? (
                <>
                  {r.match.division && (
                    <strong style={{ display: 'block' }}>{r.match.division}</strong>
                  )}
                  <MatchParticipantsList participants={r.match.participants ?? []} />
                </>
              ) : (
                <MatchTeams
                  homeTeam={r.match.homeTeam}
                  awayTeam={r.match.awayTeam}
                />
              )}
              <p style={{ margin: '0.35rem 0', color: 'var(--muted)' }}>
                {r.match.venue?.name ?? 'Sem praça'} · Solicitado por{' '}
                <strong>{r.requestedBy?.name}</strong>
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                {isPlacementMatch(r.match.modalidade) ? (
                  <>
                    Colocações:{' '}
                    <strong>
                      {formatPlacementScore(r.match.participants)}
                    </strong>
                  </>
                ) : (
                  <>
                    Placar: <strong>{r.homeScore} x {r.awayScore}</strong>
                  </>
                )}
              </p>
              <div className="inline-actions">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => approve(r.id)}
                >
                  Autorizar encerramento
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => reject(r.id)}
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {(hasFullAccess(user) || venueAuthorized) && (
      <form className="card" onSubmit={assignNeutral} style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Atribuir neutro a partida</h3>
        <label className="field-label">Partida</label>
        <select
          value={assignMatchId}
          onChange={(e) => setAssignMatchId(e.target.value)}
          required
        >
          <option value="">Selecione…</option>
          {assignableMatches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.homeTeam} x {m.awayTeam}
              {m.venue ? ` — ${m.venue.name}` : ''}
            </option>
          ))}
        </select>
        <label className="field-label">Neutro</label>
        <select
          value={assignNeutralId}
          onChange={(e) => setAssignNeutralId(e.target.value)}
          required
        >
          <option value="">Selecione…</option>
          {neutrals.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name} ({n.email})
            </option>
          ))}
        </select>
        {neutrals.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Nenhum usuário neutro cadastrado no sistema.
          </p>
        )}
        <button
          type="submit"
          className="btn"
          disabled={!assignMatchId || !assignNeutralId}
        >
          Conceder acesso
        </button>
      </form>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Neutros com acesso</h3>
        {assignments.length === 0 ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Nenhuma atribuição ativa.
          </p>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="action-row">
              <div>
                <strong>{a.adminUser.name}</strong>
                <p style={{ margin: '0.25rem 0', color: 'var(--muted)' }}>
                  <MatchTeams
                    homeTeam={a.match.homeTeam}
                    awayTeam={a.match.awayTeam}
                  />
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => revokeAssignment(a.id)}
              >
                Revogar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
