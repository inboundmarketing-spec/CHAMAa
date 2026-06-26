'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useUrlTab } from '@/lib/use-url-tab';
import { api } from '@/lib/api';
import {
  useAdminUser,
  roleLabel,
  canManageAuthorizations,
  canAccessConfirmations,
  isConfirmationsOverview,
  isVenueCoordinator,
  isNeutral,
} from '@/lib/admin-user';
import { PageSkeleton } from '@/components/PageSkeleton';
import { ConfirmationsTab } from '@/components/sports/ConfirmationsTab';
import type { MatchRow } from '@/components/sports/MatchesTab';
import {
  AdminRole,
  canGrantAuthorizationRole,
  grantableAuthorizationRoles,
} from '@chama/shared';

type Venue = { id: string; name: string };

type AllowedEntry = {
  id: string;
  email: string;
  name: string;
  role: string;
  venueId: string | null;
  venue: Venue | null;
  addedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
};

type ListResponse = {
  grantableRoles: string[];
  entries: AllowedEntry[];
};

type TabId = 'access' | 'operations';

const ROLE_OPTION_LABELS: Record<string, string> = {
  [AdminRole.MESA_LIEU]: 'Mesa da Lieu',
  [AdminRole.CRIATIVA]: 'Criativa',
  [AdminRole.CO_DIRECTOR]: 'Diretor C.O.',
  [AdminRole.VENUE_COORDINATOR]: 'C.O. Praça',
  [AdminRole.NEUTRAL]: 'Neutro',
};

const GROUP_ORDER = [
  AdminRole.MESA_LIEU,
  AdminRole.CRIATIVA,
  AdminRole.CO_DIRECTOR,
  AdminRole.VENUE_COORDINATOR,
  AdminRole.NEUTRAL,
];

function AuthorizationsContent() {
  const user = useAdminUser();

  const showAccess = !!user && canManageAuthorizations(user);
  const showOperations = !!user && canAccessConfirmations(user);

  const tabs = useMemo(() => {
    const list: { id: TabId; label: string }[] = [];
    if (showAccess) list.push({ id: 'access', label: 'Primeiro acesso' });
    if (showOperations) list.push({ id: 'operations', label: 'Confirmações' });
    return list;
  }, [showAccess, showOperations]);

  const defaultTab: TabId = showAccess ? 'access' : 'operations';
  const { tab, selectTab } = useUrlTab({
    tabs,
    defaultTab,
  });
  const [data, setData] = useState<ListResponse | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [venueId, setVenueId] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [accessLoadError, setAccessLoadError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadAccess = useCallback(async () => {
    const res = await api<ListResponse>('/api/admin/authorizations');
    setData(res);
    setRole((prev) => prev || res.grantableRoles[0] || '');
    setAccessLoadError('');
    return res;
  }, []);

  const loadOperations = useCallback(async () => {
    const m = await api<MatchRow[]>('/api/admin/matches');
    setMatches(m);
    return m;
  }, []);

  const refreshPendingCount = useCallback(async (count?: number) => {
    if (count != null) {
      setPendingCount(count);
      return;
    }
    try {
      const conf = await api<{ closureRequests: unknown[] }>(
        '/api/admin/confirmations',
      );
      setPendingCount(conf.closureRequests.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const reloadOperations = useCallback(async () => {
    await loadOperations();
    await refreshPendingCount();
  }, [loadOperations, refreshPendingCount]);

  useEffect(() => {
    if (!user || (!showAccess && !showOperations)) {
      setInitialLoading(false);
      return;
    }

    let cancelled = false;
    setLoadError('');
    setAccessLoadError('');
    setInitialLoading(true);

    void (async () => {
      const errors: string[] = [];
      let accessOk = !showAccess;
      let operationsOk = !showOperations;

      if (showAccess) {
        try {
          await loadAccess();
          if (!cancelled) accessOk = true;
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : 'Erro ao carregar acesso';
          errors.push(msg);
          if (!cancelled) setAccessLoadError(msg);
        }

        try {
          const venuesRes = await api<Venue[]>('/api/admin/catalog/venues');
          if (!cancelled) setVenues(venuesRes);
        } catch (err) {
          errors.push(
            err instanceof Error ? err.message : 'Erro ao carregar praças',
          );
        }
      }

      if (showOperations) {
        try {
          await loadOperations();
          if (!cancelled) operationsOk = true;
        } catch (err) {
          errors.push(
            err instanceof Error ? err.message : 'Erro ao carregar partidas',
          );
        }
        if (!cancelled) void refreshPendingCount();
      }

      if (!cancelled) {
        if (!accessOk && !operationsOk) {
          setLoadError(errors[0] ?? 'Erro ao carregar dados');
        }
        setInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, showAccess, showOperations, loadAccess, loadOperations, refreshPendingCount]);

  if (!user) return <PageSkeleton />;

  if (!showAccess && !showOperations) {
    return (
      <div>
        <h1>Autorizações</h1>
        <p style={{ color: 'var(--muted)' }}>
          Seu cargo não tem acesso a esta área.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h1>Autorizações</h1>
        <p style={{ color: '#ff6b6b' }}>{loadError}</p>
        <button
          type="button"
          className="btn"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (initialLoading) return <PageSkeleton />;
  if (showAccess && tab === 'access' && !data && !accessLoadError) {
    return <PageSkeleton />;
  }

  const grantable = data?.grantableRoles.length
    ? data.grantableRoles
    : grantableAuthorizationRoles(user.role);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await api<{
        skipped: boolean;
        reason?: string;
        entry: AllowedEntry;
      }>('/api/admin/authorizations', {
        method: 'POST',
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
          role,
          venueId:
            role === AdminRole.VENUE_COORDINATOR ? venueId || undefined : undefined,
        }),
      });
      if (res.skipped) {
        setInfo(res.reason ?? 'Nenhuma alteração foi feita.');
      } else {
        setInfo('E-mail adicionado à lista de primeiro acesso.');
        setEmail('');
        setName('');
      }
      await loadAccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    setError('');
    setInfo('');
    try {
      await api(`/api/admin/authorizations/${id}`, { method: 'DELETE' });
      setInfo('Autorização revogada.');
      await loadAccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao revogar');
    }
  }

  const grouped =
    data &&
    GROUP_ORDER.map((groupRole) => ({
      role: groupRole,
      label: roleLabel(groupRole),
      items: data.entries.filter((e) => e.role === groupRole),
    })).filter((g) => g.items.length > 0);

  const operationsIntro = user && isConfirmationsOverview(user)
    ? 'Visão geral: todas as praças, encerramentos, C.O. e neutros.'
    : user && isVenueCoordinator(user)
      ? 'Sua praça: aprove encerramentos e atribua neutros às partidas.'
      : user && isNeutral(user)
        ? 'Acompanhe suas solicitações de encerramento.'
        : 'Gestão do C.O.: praças, encerramentos e neutros.';

  const pageIntro =
    showAccess && showOperations
      ? `Primeiro acesso ao sistema e operações esportivas. ${operationsIntro}`
      : showAccess
        ? 'Adicione e-mails autorizados para primeiro acesso na hierarquia do C.O.'
        : operationsIntro;

  return (
    <div>
      <h1 style={{ marginBottom: '0.25rem' }}>
        Autorizações
        {showOperations && pendingCount > 0 && tab === 'operations' && (
          <span className="badge badge-live" style={{ marginLeft: 8 }}>
            {pendingCount}
          </span>
        )}
      </h1>
      <p className="page-intro">
        {pageIntro}
        {user && (
          <>
            {' '}
            Você está como <strong>{user.name}</strong> (
            {roleLabel(user.role)}).
          </>
        )}
      </p>

      {tabs.length > 1 && (
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
              {t.id === 'operations' && pendingCount > 0 && (
                <span className="badge badge-live" style={{ marginLeft: 6 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {tab === 'access' && showAccess && accessLoadError && !data && (
        <div className="card">
          <p style={{ color: '#ff6b6b', margin: 0 }}>{accessLoadError}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '1rem' }}
            onClick={() => loadAccess().catch(() => undefined)}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {tab === 'access' && showAccess && data && (
        <>
          <p className="page-intro" style={{ marginTop: 0 }}>
            Mesa e Criativa podem incluir cargos de Mesa e Criativa, além dos
            níveis abaixo (Diretor C.O. → C.O. Praça → Neutro). Se o e-mail já
            tiver cargo igual ou superior, nada será alterado.
          </p>

          <form
            className="card"
            style={{ marginTop: '1rem' }}
            onSubmit={handleAdd}
          >
            <h3 style={{ marginTop: 0 }}>Adicionar e-mail</h3>
            <div className="form-grid">
              <div>
                <label className="field-label">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">Nome (opcional)</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Preenchido automaticamente se vazio"
                />
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label className="field-label">Cargo</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  {grantable.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_OPTION_LABELS[r] ?? roleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
              {role === AdminRole.VENUE_COORDINATOR && (
                <div>
                  <label className="field-label">Praça esportiva</label>
                  <select
                    value={venueId}
                    onChange={(e) => setVenueId(e.target.value)}
                    required
                  >
                    <option value="">Selecione…</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
            {info && (
              <p
                style={{
                  color: info.includes('Nenhuma')
                    ? 'var(--muted)'
                    : 'var(--accent)',
                }}
              >
                {info}
              </p>
            )}
            <button
              type="submit"
              className="btn"
              disabled={loading || grantable.length === 0}
            >
              {loading ? 'Salvando…' : 'Adicionar à lista'}
            </button>
          </form>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>E-mails autorizados</h3>
            {data.entries.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>Nenhum e-mail na lista.</p>
            ) : (
              grouped?.map((group) => (
                <section key={group.role} style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
                    {group.label}
                  </h4>
                  <div className="table-scroll">
                    <table className="matches-table">
                      <thead>
                        <tr>
                          <th>E-mail</th>
                          <th>Nome</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((entry) => {
                          const canRevoke =
                            !!user &&
                            canGrantAuthorizationRole(user.role, entry.role);

                          return (
                            <tr key={entry.id}>
                              <td>{entry.email}</td>
                              <td>{entry.name}</td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {canRevoke && (
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleRevoke(entry.id)}
                                  >
                                    Revogar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </div>
        </>
      )}

      {tab === 'operations' && showOperations && (
        <ConfirmationsTab
          matches={matches}
          onReload={reloadOperations}
          onPendingCountChange={refreshPendingCount}
        />
      )}
    </div>
  );
}

export default function AuthorizationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AuthorizationsContent />
    </Suspense>
  );
}
