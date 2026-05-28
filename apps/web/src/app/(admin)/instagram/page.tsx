'use client';

import { useEffect, useMemo, useState } from 'react';
import { WhatsAppChat } from '@/components/WhatsAppChat';
import { api } from '@/lib/api';
import { instagramPreviewMessages } from '@/lib/instagram-message';
import { canManageBroadcasts, useAdminUser } from '@/lib/admin-user';

type QueueItem = {
  id: string;
  mediaId: string;
  mediaType?: string;
  caption?: string;
  mediaUrl?: string;
  status: string;
  permalink?: string;
  createdAt: string;
};

export default function InstagramPage() {
  const user = useAdminUser();
  const allowed = canManageBroadcasts(user);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<QueueItem | null>(null);

  const previewMessages = useMemo(
    () => (selected ? instagramPreviewMessages(selected) : []),
    [selected],
  );

  function load() {
    return api<QueueItem[]>('/api/admin/instagram/queue').then((items) => {
      setQueue(items);
      setSelected((prev) => {
        if (!prev) return items[0] ?? null;
        return items.find((i) => i.id === prev.id) ?? items[0] ?? null;
      });
    });
  }

  useEffect(() => {
    if (allowed) load().catch(console.error);
  }, [allowed]);

  async function poll() {
    await api('/api/admin/instagram/poll', { method: 'POST' });
    load();
  }

  async function approve(id: string) {
    await api(`/api/admin/instagram/queue/${id}/approve`, { method: 'POST' });
    load();
  }

  async function reject(id: string) {
    await api(`/api/admin/instagram/queue/${id}/reject`, { method: 'POST' });
    load();
  }

  if (!allowed) {
    return (
      <div>
        <h1>Promoter Instagram</h1>
        <p className="card" style={{ marginTop: '1rem', color: 'var(--muted)' }}>
          Acesso restrito à equipe de comunicação (administrador, mesa Lieu ou
          criativa).
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Promoter Instagram</h1>
      <p className="page-intro">
        Posts novos entram na fila e no grupo de moderação no WhatsApp. Após
        aprovar, o conteúdo vai para grupos configurados e para quem tem opt-in
        de avisos no PV.
      </p>
      <button
        type="button"
        className="btn"
        style={{ marginTop: '1rem' }}
        onClick={poll}
      >
        Buscar posts agora
      </button>

      <div className="page-split">
        <div className="card page-split-main">
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Legenda</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: 'var(--muted)' }}>
                    Nenhum item na fila.
                  </td>
                </tr>
              )}
              {queue.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    background:
                      selected?.id === item.id
                        ? 'rgba(255,255,255,0.04)'
                        : undefined,
                  }}
                >
                  <td>{item.caption?.slice(0, 80) ?? '—'}</td>
                  <td>{item.status}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary btn"
                      onClick={() => setSelected(item)}
                    >
                      Preview
                    </button>
                    {item.permalink && (
                      <>
                        {' '}
                        <a
                          href={item.permalink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          IG
                        </a>
                      </>
                    )}
                    {item.status === 'pending' && (
                      <>
                        {' '}
                        <button
                          type="button"
                          className="btn"
                          onClick={() => approve(item.id)}
                        >
                          Aprovar
                        </button>{' '}
                        <button
                          type="button"
                          className="btn-secondary btn"
                          onClick={() => reject(item.id)}
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
        </div>

        <div className="page-split-side">
          <p
            className="page-muted-narrow"
            style={{ marginBottom: '0.5rem', maxWidth: 320 }}
          >
            Pré-visualização no PV (texto + imagem, como no envio real).
            {selected?.mediaType && (
              <>
                {' '}
                Tipo: <strong>{selected.mediaType}</strong>.
              </>
            )}
          </p>
          <WhatsAppChat
            messages={previewMessages}
            provider="preview"
            readOnly
            emptyHint="Selecione um item da fila para pré-visualizar."
          />
        </div>
      </div>
    </div>
  );
}
