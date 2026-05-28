'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  useAdminUser,
  roleLabel,
  canManageAuthorizations,
} from '@/lib/admin-user';
import { PageSkeleton } from '@/components/PageSkeleton';
import { AdminRole, canGrantAuthorizationRole, grantableAuthorizationRoles } from '@chama/shared';

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

const ROLE_OPTION_LABELS: Record<string, string> = {
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

export default function AuthorizationsPage() {
  const user = useAdminUser();
  const [data, setData] = useState<ListResponse | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [venueId, setVenueId] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api<ListResponse>('/api/admin/authorizations');
    setData(res);
    setRole((prev) => prev || res.grantableRoles[0] || '');
    return res;
  }, []);

  useEffect(() => {
    if (!user || !canManageAuthorizations(user)) {
      setInitialLoading(false);
      return;
    }

    let cancelled = false;
    setLoadError('');
    setInitialLoading(true);

    Promise.all([
      load(),
      api<Venue[]>('/api/admin/catalog/venues'),
    ])
      .then(([, venuesRes]) => {
        if (cancelled) return;
        setVenues(venuesRes);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : 'Erro ao carregar autorizações',
        );
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, load]);

  if (!user) return <PageSkeleton />;
  if (!canManageAuthorizations(user)) {
    return (
      <div>
        <h1>Autorizações</h1>
        <p style={{ color: 'var(--muted)' }}>
          Seu cargo não pode gerenciar autorizações de acesso.
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

  if (initialLoading || !data) return <PageSkeleton />;

  const grantable = data.grantableRoles.length
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
      await load();
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao revogar');
    }
  }

  const grouped = GROUP_ORDER.map((groupRole) => ({
    role: groupRole,
    label: roleLabel(groupRole),
    items: data.entries.filter((e) => e.role === groupRole),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <h1>Autorizações</h1>
      <p className="page-intro">
        Adicione e-mails autorizados para primeiro acesso. Você só pode incluir
        cargos abaixo do seu na hierarquia: Mesa/Criativa → Diretor → C.O.
        Praça → Neutro. Se o e-mail já tiver cargo igual ou superior, nada será
        alterado.
      </p>

      <form className="card" style={{ marginTop: '1.5rem' }} onSubmit={handleAdd}>
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
          <p style={{ color: info.includes('Nenhuma') ? 'var(--muted)' : 'var(--accent)' }}>
            {info}
          </p>
        )}
        <button type="submit" className="btn" disabled={loading || grantable.length === 0}>
          {loading ? 'Salvando…' : 'Adicionar à lista'}
        </button>
      </form>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>E-mails autorizados</h3>
        {data.entries.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Nenhum e-mail na lista.</p>
        ) : (
          grouped.map((group) => (
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
                      !!user && canGrantAuthorizationRole(user.role, entry.role);

                    return (
                      <tr key={entry.id}>
                        <td>{entry.email}</td>
                        <td>{entry.name}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
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
    </div>
  );
}
