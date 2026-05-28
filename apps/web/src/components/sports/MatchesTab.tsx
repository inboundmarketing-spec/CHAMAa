'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { AtleticaDivisionTier } from '@chama/shared';
import { api } from '@/lib/api';
import { STATUS_LABELS, formatModalidadeOption, modalidadeSportName, dedupeModalidades } from '@/lib/sports-labels';
import {
  formatPlacementScore,
  isPlacementMatch,
  provasForModalidade,
  type MatchParticipant,
} from '@/lib/placement-match';
import { IncidentPanel } from './IncidentPanel';
import { MatchDisciplinePanel } from './MatchDisciplinePanel';
import { DateTimeField } from './DateTimeField';
import {
  AtleticaSelect,
  AtleticaMultiSelect,
  MatchTeams,
  MatchParticipantsList,
} from './AtleticaLogo';
import { ATLETICAS } from '@chama/shared';
import { ModalidadeLabel } from './ModalidadeLabel';
import { venueMapsUrl } from '@/lib/venue-maps';
import type { Venue } from './VenuesTab';

export type MatchRow = {
  id: string;
  homeTeam?: string | null;
  awayTeam?: string | null;
  homeScore: number;
  awayScore: number;
  status: string;
  scheduledAt: string;
  liveStartedAt?: string | null;
  gamePeriod?: string | null;
  division?: string | null;
  venueId?: string | null;
  participants?: MatchParticipant[];
  modalidade: {
    id: string;
    name: string;
    slug: string;
    category: string;
    gender: string;
    scoringMode?: string;
  };
  venue?: { id: string; name: string; address: string; mapUrl?: string | null } | null;
  _count?: { incidents: number };
  pointsWarning?: boolean;
  homePointsAwarded?: number | null;
  awayPointsAwarded?: number | null;
  canOperate?: boolean;
};

type Modalidade = MatchRow['modalidade'];

export function MatchesTab({
  matches,
  modalidades,
  venues,
  onReload,
  canCreate = true,
}: {
  matches: MatchRow[];
  modalidades: Modalidade[];
  venues: Venue[];
  onReload: () => Promise<void>;
  canCreate?: boolean;
}) {
  const [form, setForm] = useState({
    modalidadeId: '',
    venueId: '',
    homeTeam: '',
    awayTeam: '',
    division: '',
    scheduledAt: '',
    status: 'scheduled',
  });
  const [participantTeams, setParticipantTeams] = useState<string[]>([]);
  const [filterGender, setFilterGender] = useState<string>('all');
  const [expandedPoints, setExpandedPoints] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterModalidadeId, setFilterModalidadeId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [teamDivisions, setTeamDivisions] = useState<Map<string, string>>(
    new Map(),
  );

  const loadDivisions = useCallback(async () => {
    if (!canCreate) return;
    const rows = await api<{ team: string; division: string }[]>(
      '/api/admin/standings/divisions',
    );
    setTeamDivisions(
      new Map(rows.map((r) => [r.team.toLowerCase(), r.division])),
    );
  }, [canCreate]);

  useEffect(() => {
    loadDivisions().catch(console.error);
  }, [loadDivisions]);

  const awayTeamOptions = useMemo(() => {
    if (!form.homeTeam) return undefined;
    const homeDiv =
      teamDivisions.get(form.homeTeam.toLowerCase()) ??
      AtleticaDivisionTier.FIRST;
    return ATLETICAS.filter(
      (t) =>
        t !== form.homeTeam &&
        (teamDivisions.get(t.toLowerCase()) ?? AtleticaDivisionTier.FIRST) ===
          homeDiv,
    );
  }, [form.homeTeam, teamDivisions]);

  const catalogModalidades = dedupeModalidades(modalidades);

  const filteredModalidades = catalogModalidades.filter((m) => {
    if (filterGender !== 'all' && m.gender !== filterGender) return false;
    if (filterCategory !== 'all' && m.category !== filterCategory) return false;
    return true;
  });

  const selectedModalidadeId =
    filteredModalidades.some((m) => m.id === form.modalidadeId)
      ? form.modalidadeId
      : (filteredModalidades[0]?.id ?? '');

  const selectedModalidade = catalogModalidades.find(
    (m) => m.id === selectedModalidadeId,
  );
  const placementMode = isPlacementMatch(selectedModalidade);
  const provas = selectedModalidade
    ? provasForModalidade(selectedModalidade.slug)
    : null;

  const selectedVenueId =
    venues.some((v) => v.id === form.venueId)
      ? form.venueId
      : (venues[0]?.id ?? '');

  useEffect(() => {
    const nextId = selectedModalidadeId;
    if (nextId && form.modalidadeId !== nextId) {
      setForm((prev) => ({ ...prev, modalidadeId: nextId, division: '' }));
      setParticipantTeams([]);
    }
  }, [selectedModalidadeId, form.modalidadeId]);

  useEffect(() => {
    const nextId = selectedVenueId;
    if (nextId && form.venueId !== nextId) {
      setForm((prev) => ({ ...prev, venueId: nextId }));
    }
  }, [selectedVenueId, form.venueId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModalidadeId || !selectedVenueId) return;

    const body: Record<string, unknown> = {
      modalidadeId: selectedModalidadeId,
      venueId: selectedVenueId,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      status: form.status,
    };

    if (placementMode) {
      body.division = form.division;
      body.participants = participantTeams.map((team) => ({ team }));
    } else {
      body.homeTeam = form.homeTeam;
      body.awayTeam = form.awayTeam;
    }

    await api('/api/admin/matches', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setForm({
      modalidadeId: filteredModalidades[0]?.id ?? '',
      venueId: venues[0]?.id ?? '',
      homeTeam: '',
      awayTeam: '',
      division: '',
      scheduledAt: '',
      status: 'scheduled',
    });
    setParticipantTeams([]);
    await onReload();
  }

  async function updateStatus(id: string, status: string) {
    await api(`/api/admin/matches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await onReload();
  }

  const displayMatches = matches.filter((m) => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (
      filterModalidadeId !== 'all' &&
      m.modalidade.id !== filterModalidadeId
    ) {
      return false;
    }
    return true;
  });

  const finishedCount = matches.filter((m) => m.status === 'finished').length;

  const canSubmitPlacement =
    placementMode &&
    form.division &&
    participantTeams.length >= 2;
  const canSubmitVersus =
    !placementMode &&
    form.homeTeam &&
    form.awayTeam &&
    form.homeTeam !== form.awayTeam;

  return (
    <div>
      {canCreate && (
      <form className="card match-create-form" onSubmit={create}>
        <h3 style={{ marginTop: 0 }}>Nova partida</h3>
        <div className="form-grid">
          <div>
            <label className="field-label">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="collective">Coletivos</option>
              <option value="individual">Individuais / combate</option>
            </select>
          </div>
          <div>
            <label className="field-label">Gênero</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>
        </div>
        <label className="field-label">Modalidade</label>
        <select
          value={selectedModalidadeId}
          onChange={(e) =>
            setForm({ ...form, modalidadeId: e.target.value, division: '' })
          }
          required
          disabled={filteredModalidades.length === 0}
        >
          {filteredModalidades.map((m) => (
            <option key={m.id} value={m.id}>
              {filterGender === 'all'
                ? formatModalidadeOption(m.name, m.gender)
                : modalidadeSportName(m.name, m.gender)}
            </option>
          ))}
        </select>

        {placementMode && provas && (
          <>
            <label className="field-label">Prova</label>
            <select
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              required
            >
              <option value="">Selecione a prova...</option>
              {provas.map((prova) => (
                <option key={prova} value={prova}>
                  {prova}
                </option>
              ))}
            </select>
          </>
        )}

        <label className="field-label">Praça esportiva</label>
        {venues.length === 0 ? (
          <p style={{ color: 'var(--muted)', margin: '0.25rem 0 0.75rem' }}>
            Cadastre ao menos uma praça esportiva na aba &quot;Praças
            esportivas&quot; antes de criar partidas.
          </p>
        ) : (
          <select
            value={selectedVenueId}
            onChange={(e) => setForm({ ...form, venueId: e.target.value })}
            required
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}

        {placementMode ? (
          <>
            <label className="field-label">Atléticas participantes</label>
            <AtleticaMultiSelect
              selected={participantTeams}
              onChange={setParticipantTeams}
              min={2}
            />
          </>
        ) : (
          <div className="form-grid">
            <div>
              <AtleticaSelect
                label="Atlética (casa)"
                value={form.homeTeam}
                onChange={(homeTeam) =>
                  setForm({ ...form, homeTeam, awayTeam: '' })
                }
                exclude={form.awayTeam}
                required
              />
            </div>
            <div>
              <AtleticaSelect
                label="Atlética (visitante — mesma divisão)"
                value={form.awayTeam}
                onChange={(awayTeam) => setForm({ ...form, awayTeam })}
                exclude={form.homeTeam}
                onlyFrom={awayTeamOptions}
                required
              />
            </div>
          </div>
        )}

        <DateTimeField
          value={form.scheduledAt}
          onChange={(scheduledAt) => setForm({ ...form, scheduledAt })}
          required
        />
        <button
          type="submit"
          className="btn"
          disabled={
            !selectedModalidadeId ||
            !selectedVenueId ||
            venues.length === 0 ||
            !form.scheduledAt ||
            !(canSubmitPlacement || canSubmitVersus)
          }
        >
          Cadastrar partida
        </button>
      </form>
      )}

      <div className="card" style={{ marginTop: canCreate ? '1.5rem' : 0 }}>
        <div className="filters-bar">
          <h3>Partidas</h3>
          <div className="filters-group">
            <div>
              <label className="field-label" style={{ marginBottom: '0.25rem' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="scheduled">Agendado</option>
                <option value="live">Ao vivo</option>
                <option value="finished">Finalizado</option>
              </select>
            </div>
            <div>
              <label className="field-label" style={{ marginBottom: '0.25rem' }}>
                Modalidade
              </label>
              <select
                value={filterModalidadeId}
                onChange={(e) => setFilterModalidadeId(e.target.value)}
              >
                <option value="all">Todas</option>
                {catalogModalidades.map((m) => (
                  <option key={m.id} value={m.id}>
                    {formatModalidadeOption(m.name, m.gender)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {finishedCount > 0 && filterStatus === 'all' && (
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
            {finishedCount} partida(s) finalizada(s) na lista. Use o filtro
            &quot;Finalizado&quot; para ver somente essas.
          </p>
        )}
        <div className="table-scroll">
        <table className="matches-table">
          <thead>
            <tr>
              <th>Modalidade</th>
              <th>Partida</th>
              <th>Praça</th>
              <th>Resultado</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {displayMatches.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: 'var(--muted)', padding: '1rem 0' }}>
                  Nenhuma partida encontrada com os filtros atuais.
                </td>
              </tr>
            )}
            {displayMatches.map((m) => {
              const placement = isPlacementMatch(m.modalidade);
              const matchLabel = placement
                ? `${m.division ?? m.modalidade.name} (${(m.participants ?? []).map((p) => p.team).join(', ')})`
                : `${m.homeTeam ?? ''} x ${m.awayTeam ?? ''}`;

              return (
              <Fragment key={m.id}>
              <tr>
                <td>
                  <ModalidadeLabel
                    name={m.modalidade.name}
                    gender={m.modalidade.gender}
                    division={m.division}
                  />
                </td>
                <td>
                  {placement ? (
                    <>
                      {m.division && (
                        <strong style={{ display: 'block', marginBottom: 4 }}>
                          {m.division}
                        </strong>
                      )}
                      <MatchParticipantsList participants={m.participants ?? []} />
                    </>
                  ) : (
                    <MatchTeams homeTeam={m.homeTeam} awayTeam={m.awayTeam} />
                  )}
                  <br />
                  <small>
                    {new Date(m.scheduledAt).toLocaleString('pt-BR')}
                  </small>
                </td>
                <td>
                  {m.venue ? (
                    <a
                      href={venueMapsUrl(m.venue)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="venue-link"
                    >
                      {m.venue.name}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>—</span>
                  )}
                </td>
                <td>
                  {placement
                    ? formatPlacementScore(m.participants)
                    : `${m.homeScore} x ${m.awayScore}`}
                </td>
                <td>
                  <span
                    className={
                      m.status === 'live'
                        ? 'badge badge-live'
                        : m.status === 'finished'
                          ? 'badge badge-finished'
                          : 'badge'
                    }
                  >
                    {STATUS_LABELS[m.status] ?? m.status}
                  </span>
                </td>
                <td className="match-actions">
                  <div className="match-actions-inner">
                    {m.canOperate !== false && (
                      <>
                        {m.status !== 'live' && m.status !== 'finished' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm match-action-btn"
                            onClick={() => updateStatus(m.id, 'live')}
                          >
                            Ao vivo
                          </button>
                        )}
                        {m.status === 'live' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm match-action-btn"
                            onClick={() => updateStatus(m.id, 'scheduled')}
                          >
                            Desmarcar
                          </button>
                        )}
                        <IncidentPanel
                          matchId={m.id}
                          matchLabel={matchLabel}
                          onSaved={onReload}
                          variant="modal"
                          triggerStyle="button"
                          actionLabel="Ficha"
                          hasIncident={(m._count?.incidents ?? 0) > 0}
                        />
                        {m.status === 'finished' &&
                          !placement &&
                          m.homeTeam &&
                          m.awayTeam && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm match-action-btn"
                              onClick={() =>
                                setExpandedPoints(
                                  expandedPoints === m.id ? null : m.id,
                                )
                              }
                            >
                              Pontos
                              {m.pointsWarning && ' ⚠'}
                            </button>
                          )}
                      </>
                    )}
                    {m.canOperate === false && (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        Somente leitura
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            {expandedPoints === m.id &&
              m.status === 'finished' &&
              m.homeTeam &&
              m.awayTeam && (
                <tr key={`${m.id}-pts`}>
                  <td colSpan={6}>
                    <MatchDisciplinePanel
                      matchId={m.id}
                      homeTeam={m.homeTeam}
                      awayTeam={m.awayTeam}
                      status={m.status}
                      pointsWarning={m.pointsWarning}
                      onSaved={onReload}
                    />
                  </td>
                </tr>
              )}
              </Fragment>
            );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
