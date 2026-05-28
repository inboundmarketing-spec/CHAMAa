'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageSkeleton } from '@/components/PageSkeleton';

type Suggestion = {
  id: string;
  suggestion: string;
  createdAt: string;
  waUser: { waId: string; name: string | null };
};

export default function HelpFeedbackPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return api<Suggestion[]>('/api/admin/help/suggestions').then(setItems);
  }, []);

  useEffect(() => {
    load()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [load]);

  async function remove(id: string) {
    if (!confirm('Excluir esta sugestão?')) return;
    await api(`/api/admin/help/suggestions/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <h1>Sugestões — Ajuda</h1>
      <p className="page-intro">
        Mensagens enviadas pelos usuários ao encerrar o fluxo *Ajuda* no
        WhatsApp. Não tem relação com o atendimento SOS Lieu — apenas o caminho
        no bot para escrever a sugestão é parecido.
      </p>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        {items.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>Nenhuma sugestão ainda.</p>
        )}
        {items.length > 0 && (
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Data e hora</th>
                <th>WhatsApp</th>
                <th>Sugestão</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(s.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td>
                    {s.waUser.name ?? '—'}
                    <br />
                    <small>{s.waUser.waId}</small>
                  </td>
                  <td className="table-cell-wrap">
                    {s.suggestion}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary btn"
                      onClick={() => remove(s.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
