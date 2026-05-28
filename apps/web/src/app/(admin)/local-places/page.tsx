'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  LOCAL_GUIDE_TYPE_LABELS,
  LocalGuidePlaceStatus,
  LocalGuidePlaceType,
} from '@chama/shared';
import {
  hasFullAccess,
  isNeutral,
  isVenueCoordinator,
  useAdminUser,
} from '@/lib/admin-user';
import { VenuesTab, type Venue } from '@/components/sports/VenuesTab';

type Place = {
  id: string;
  type: string;
  name: string;
  address: string;
  phone?: string | null;
  status: string;
  submittedBy?: string | null;
};

type Accommodation = {
  id: string;
  name: string;
  address: string;
  mapUrl?: string | null;
  atleticas: {
    atletica: { id: string; name: string; campus: { name: string } };
  }[];
};

type AtleticaOption = {
  id: string;
  name: string;
  campus: { name: string };
};

type TabId = 'venues' | 'accommodations' | 'guide';

export default function LocalPlacesPage() {
  const user = useAdminUser();
  const canEdit = hasFullAccess(user);
  const isCo = isVenueCoordinator(user);
  const isNeut = isNeutral(user);
  const venuesReadOnly = !canEdit && (isCo || isNeut);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'venues', label: 'Praças esportivas' },
  ];
  if (canEdit) {
    tabs.push({ id: 'accommodations', label: 'Alojamentos' });
    tabs.push({ id: 'guide', label: 'Locais úteis' });
  } else if (!venuesReadOnly) {
    tabs.push({ id: 'guide', label: 'Locais úteis' });
  }

  const [tab, setTab] = useState<TabId>('venues');
  const [places, setPlaces] = useState<Place[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [atleticas, setAtleticas] = useState<AtleticaOption[]>([]);
  const [accForm, setAccForm] = useState({
    id: '',
    name: '',
    address: '',
    mapUrl: '',
    atleticaIds: [] as string[],
    notes: '',
  });

  const load = useCallback(async () => {
    const requests: Promise<unknown>[] = [
      api<Venue[]>('/api/admin/catalog/venues').then(setVenues),
    ];
    if (canEdit) {
      requests.push(
        api<Place[]>('/api/admin/local-places').then(setPlaces),
        api<Accommodation[]>('/api/admin/accommodations').then(setAccommodations),
        api<{ id: string; name: string; atleticas: AtleticaOption[] }[]>(
          '/api/admin/catalog/campi',
        ).then((campi) => {
          const all = campi.flatMap((c) =>
            c.atleticas.map((a) => ({ ...a, campus: { name: c.name } })),
          );
          setAtleticas(
            all.sort((a, b) =>
              a.campus.name.localeCompare(b.campus.name, 'pt-BR'),
            ),
          );
        }),
      );
    }
    await Promise.all(requests);
  }, [canEdit]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  async function review(id: string, status: string) {
    await api(`/api/admin/local-places/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await load();
  }

  function toggleAtletica(atleticaId: string) {
    setAccForm((prev) => {
      const has = prev.atleticaIds.includes(atleticaId);
      return {
        ...prev,
        atleticaIds: has
          ? prev.atleticaIds.filter((id) => id !== atleticaId)
          : [...prev.atleticaIds, atleticaId],
      };
    });
  }

  function editAccommodation(acc: Accommodation) {
    setAccForm({
      id: acc.id,
      name: acc.name,
      address: acc.address,
      mapUrl: acc.mapUrl ?? '',
      atleticaIds: acc.atleticas.map((a) => a.atletica.id),
      notes: '',
    });
  }

  async function saveAccommodation(e: React.FormEvent) {
    e.preventDefault();
    await api('/api/admin/accommodations', {
      method: 'POST',
      body: JSON.stringify({
        id: accForm.id || undefined,
        name: accForm.name,
        address: accForm.address,
        mapUrl: accForm.mapUrl || undefined,
        atleticaIds: accForm.atleticaIds,
        notes: accForm.notes || undefined,
      }),
    });
    setAccForm({
      id: '',
      name: '',
      address: '',
      mapUrl: '',
      atleticaIds: [],
      notes: '',
    });
    await load();
  }

  const guidePlaces = places.filter(
    (p) => p.type !== LocalGuidePlaceType.SPORTS_SQUARE,
  );
  const pending = guidePlaces.filter(
    (p) => p.status === LocalGuidePlaceStatus.PENDING,
  );

  return (
    <div>
      <h1>Locais</h1>
      <p className="page-intro">
        Praças esportivas usadas em partidas e placar ao vivo, alojamentos (várias
        atléticas no mesmo local) e cadastros de locais úteis enviados pelos
        atléticanos.
      </p>

      {tabs.length > 1 && (
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'venues' && (
        <VenuesTab
          venues={venues}
          onReload={load}
          readOnly={venuesReadOnly}
        />
      )}

      {tab === 'accommodations' && canEdit && (
        <>
          <form
            className="card"
            onSubmit={saveAccommodation}
            style={{ marginBottom: '1rem' }}
          >
            <h3 style={{ marginTop: 0 }}>
              {accForm.id ? 'Editar alojamento' : 'Novo alojamento'}
            </h3>
            <div className="form-grid">
              <input
                placeholder="Nome do alojamento"
                required
                value={accForm.name}
                onChange={(e) =>
                  setAccForm({ ...accForm, name: e.target.value })
                }
              />
              <input
                placeholder="Endereço completo"
                required
                value={accForm.address}
                onChange={(e) =>
                  setAccForm({ ...accForm, address: e.target.value })
                }
              />
              <input
                placeholder="Link do mapa (Google Maps, etc.)"
                value={accForm.mapUrl}
                onChange={(e) =>
                  setAccForm({ ...accForm, mapUrl: e.target.value })
                }
              />
            </div>

            <label className="field-label" style={{ marginTop: '0.75rem' }}>
              Atléticas neste alojamento
            </label>
            <div className="acc-atletica-grid">
              {atleticas.map((a) => (
                <label key={a.id} className="acc-atletica-chip">
                  <input
                    type="checkbox"
                    checked={accForm.atleticaIds.includes(a.id)}
                    onChange={() => toggleAtletica(a.id)}
                  />
                  {a.campus.name}
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-sm"
              style={{ marginTop: '0.75rem' }}
              disabled={accForm.atleticaIds.length === 0}
            >
              Salvar alojamento
            </button>
            {accForm.id && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.5rem', marginLeft: '0.5rem' }}
                onClick={() =>
                  setAccForm({
                    id: '',
                    name: '',
                    address: '',
                    mapUrl: '',
                    atleticaIds: [],
                    notes: '',
                  })
                }
              >
                Cancelar edição
              </button>
            )}
          </form>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Alojamentos cadastrados</h3>
            {accommodations.length === 0 && (
              <p style={{ color: 'var(--muted)' }}>Nenhum alojamento.</p>
            )}
            <ul className="acc-list">
              {accommodations.map((a) => (
                <li key={a.id}>
                  <strong>{a.name}</strong>: {a.address}
                  {a.mapUrl && (
                    <>
                      {' '}
                      ·{' '}
                      <a href={a.mapUrl} target="_blank" rel="noreferrer">
                        mapa
                      </a>
                    </>
                  )}
                  <br />
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    Atléticas:{' '}
                    {a.atleticas.map((x) => x.atletica.campus.name).join(', ')}
                  </span>
                  {' · '}
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => editAccommodation(a)}
                  >
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <style jsx>{`
            .acc-atletica-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
            }
            .acc-atletica-chip {
              display: flex;
              align-items: center;
              gap: 0.35rem;
              background: var(--surface-2, #1e293b);
              padding: 0.35rem 0.65rem;
              border-radius: 999px;
              font-size: 0.85rem;
              cursor: pointer;
            }
            .acc-list {
              list-style: none;
              margin: 0;
              padding: 0;
            }
            .acc-list li {
              padding: 0.65rem 0;
              border-bottom: 1px solid var(--border);
            }
            .acc-list li:last-child {
              border-bottom: none;
            }
          `}</style>
        </>
      )}

      {tab === 'guide' && canEdit && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            Locais úteis ({pending.length} pendentes)
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Marmitas, farmácias, hospitais e fast foods enviados pelo formulário
            público. Praças esportivas oficiais ficam na aba acima.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nome</th>
                  <th>Endereço</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {guidePlaces.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {LOCAL_GUIDE_TYPE_LABELS[
                        p.type as LocalGuidePlaceType
                      ] ?? p.type}
                    </td>
                    <td>{p.name}</td>
                    <td>{p.address}</td>
                    <td>{p.status}</td>
                    <td>
                      {p.status === LocalGuidePlaceStatus.PENDING && (
                        <>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() =>
                              review(p.id, LocalGuidePlaceStatus.APPROVED)
                            }
                          >
                            Aprovar
                          </button>
                          {' · '}
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() =>
                              review(p.id, LocalGuidePlaceStatus.REJECTED)
                            }
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: '1rem' }}>
            <a href="/cadastro-local" target="_blank" rel="noreferrer">
              Abrir formulário público para Atléticanos Locais
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
