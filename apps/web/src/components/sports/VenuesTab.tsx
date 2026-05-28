'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { venueMapsUrl } from '@/lib/venue-maps';

export type Venue = {
  id: string;
  name: string;
  address: string;
  mapUrl?: string | null;
  _count?: { matches: number };
};

export function VenuesTab({
  venues,
  onReload,
  readOnly = false,
}: {
  venues: Venue[];
  onReload: () => Promise<void>;
  readOnly?: boolean;
}) {
  const [form, setForm] = useState({ name: '', address: '', mapUrl: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    mapUrl: '',
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api('/api/admin/catalog/venues', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        address: form.address,
        mapUrl: form.mapUrl || undefined,
      }),
    });
    setForm({ name: '', address: '', mapUrl: '' });
    await onReload();
  }

  function startEdit(v: Venue) {
    setEditingId(v.id);
    setEditForm({
      name: v.name,
      address: v.address,
      mapUrl: v.mapUrl ?? '',
    });
  }

  async function saveEdit(id: string) {
    await api(`/api/admin/catalog/venues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: editForm.name,
        address: editForm.address,
        mapUrl: editForm.mapUrl || undefined,
      }),
    });
    setEditingId(null);
    await onReload();
  }

  return (
    <div>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        {readOnly
          ? 'Consulte endereços e mapas das praças esportivas. Todos os neutros têm acesso a esta lista.'
          : 'Cadastre e edite o endereço das praças esportivas. O C.O. da praça usa estes locais ao operar partidas e o placar ao vivo.'}
      </p>
      {!readOnly && (
        <form className="card" onSubmit={create}>
          <h3 style={{ marginTop: 0 }}>Nova praça esportiva</h3>
          <label className="field-label">Nome</label>
          <input
            placeholder="Ex.: Ginásio Municipal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <label className="field-label">Endereço completo</label>
          <input
            placeholder="Rua, número, bairro, cidade"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
          <label className="field-label">Link do mapa (opcional)</label>
          <input
            placeholder="https://maps.google.com/..."
            value={form.mapUrl}
            onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
          />
          <button type="submit" className="btn">
            Adicionar praça
          </button>
        </form>
      )}

      <div className="card" style={{ marginTop: readOnly ? 0 : '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Praças cadastradas</h3>
        {venues.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>Nenhuma praça cadastrada.</p>
        )}
        {venues.map((v) => (
          <div
            key={v.id}
            style={{
              padding: '1rem 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {editingId === v.id && !readOnly ? (
              <>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
                <input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                />
                <input
                  placeholder="Link do mapa"
                  value={editForm.mapUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, mapUrl: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => saveEdit(v.id)}
                >
                  Salvar
                </button>{' '}
                <button
                  type="button"
                  className="btn-secondary btn"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <strong>{v.name}</strong>
                <p style={{ margin: '0.25rem 0', color: 'var(--muted)' }}>
                  {v.address}
                </p>
                <p style={{ margin: 0 }}>
                  <a
                    href={venueMapsUrl(v)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="venue-link"
                  >
                    Ver no mapa
                  </a>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {v._count?.matches ?? 0} partida(s) vinculada(s)
                </p>
                {!readOnly && (
                  <button
                    type="button"
                    className="btn-secondary btn"
                    onClick={() => startEdit(v)}
                  >
                    Editar endereço
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
