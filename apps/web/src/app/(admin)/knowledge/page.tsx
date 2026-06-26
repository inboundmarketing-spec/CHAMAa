'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageSkeleton } from '@/components/PageSkeleton';

type Article = {
  id: string;
  title: string;
  content: string;
  tags: string;
  active: boolean;
};

type ArticleForm = {
  title: string;
  content: string;
  tags: string;
  active: boolean;
};

const emptyForm: ArticleForm = {
  title: '',
  content: '',
  tags: '',
  active: true,
};

export default function KnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ArticleForm>(emptyForm);
  const [loading, setLoading] = useState(true);

  function load() {
    return api<Article[]>('/api/admin/help/knowledge').then(setArticles);
  }

  useEffect(() => {
    load()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api('/api/admin/help/knowledge', {
      method: 'POST',
      body: JSON.stringify({
        title: form.title,
        content: form.content,
        tags: form.tags,
        active: form.active,
      }),
    });
    setForm(emptyForm);
    load();
  }

  function startEdit(article: Article) {
    setEditingId(article.id);
    setEditForm({
      title: article.title,
      content: article.content,
      tags: article.tags,
      active: article.active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
  }

  async function saveEdit(id: string) {
    await api(`/api/admin/help/knowledge/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(editForm),
    });
    cancelEdit();
    load();
  }

  async function remove(id: string) {
    if (!confirm('Excluir este artigo?')) return;
    if (editingId === id) cancelEdit();
    await api(`/api/admin/help/knowledge/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <h1>Base de conhecimento</h1>
      <p className="page-intro">
        Textos usados pela chaminha no fluxo *Ajuda*. Com a IA ativada
        (HELP_LLM_ENABLED), estes artigos viram contexto para respostas
        conversacionais. Adicione informações claras e completas sobre o Inter.
      </p>

      <form className="card" style={{ marginTop: '1rem' }} onSubmit={create}>
        <h3>Novo artigo</h3>
        <input
          placeholder="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Tags (separadas por vírgula)"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />
        <textarea
          placeholder="Conteúdo"
          rows={5}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Ativo (visível para a chaminha)
        </label>
        <button type="submit" className="btn">
          Salvar artigo
        </button>
      </form>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tags</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) =>
              editingId === a.id ? (
                <tr key={a.id}>
                  <td colSpan={4}>
                    <input
                      placeholder="Título"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      required
                    />
                    <input
                      placeholder="Tags (separadas por vírgula)"
                      value={editForm.tags}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tags: e.target.value })
                      }
                      style={{ marginTop: '0.5rem' }}
                    />
                    <textarea
                      placeholder="Conteúdo"
                      rows={6}
                      value={editForm.content}
                      onChange={(e) =>
                        setEditForm({ ...editForm, content: e.target.value })
                      }
                      required
                      style={{ marginTop: '0.5rem' }}
                    />
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editForm.active}
                        onChange={(e) =>
                          setEditForm({ ...editForm, active: e.target.checked })
                        }
                      />
                      Ativo (visível para a chaminha)
                    </label>
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => saveEdit(a.id)}
                      >
                        Salvar alterações
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn"
                        onClick={cancelEdit}
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={a.id}>
                  <td>
                    <strong>{a.title}</strong>
                    <br />
                    <small style={{ color: 'var(--muted)' }}>
                      {a.content.slice(0, 120)}
                      {a.content.length > 120 ? '…' : ''}
                    </small>
                  </td>
                  <td>{a.tags || '—'}</td>
                  <td>{a.active ? 'Ativo' : 'Inativo'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="btn-secondary btn"
                      onClick={() => startEdit(a)}
                    >
                      Editar
                    </button>{' '}
                    <button
                      type="button"
                      className="btn-secondary btn"
                      onClick={() => remove(a.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
