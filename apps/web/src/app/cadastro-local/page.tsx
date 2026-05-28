'use client';

import { useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

const TYPES = [
  { value: 'marmita', label: 'Marmita' },
  { value: 'pharmacy', label: 'Farmácia' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'fast_food', label: 'Fast Food' },
];

export default function CadastroLocalPage() {
  const [form, setForm] = useState({
    type: 'marmita',
    name: '',
    address: '',
    phone: '',
    siteUrl: '',
    menuUrl: '',
    submittedBy: '',
    imageUrls: '',
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/public/local-places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          imageUrls: form.imageUrls
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="public-form-page">
        <h1>Cadastro enviado</h1>
        <p>Obrigado! A mesa vai revisar e aprovar o local em breve.</p>
      </main>
    );
  }

  return (
    <main className="public-form-page">
      <h1>Atléticano Local</h1>
      <p>Cadastre um local útil para atléticas no Inter (marmita, farmácia, etc.).</p>
      <form onSubmit={submit} className="card">
        <label className="field-label">Categoria</label>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <label className="field-label">Nome do estabelecimento</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <label className="field-label">Endereço completo</label>
        <input
          required
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <label className="field-label">Telefone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <label className="field-label">Site</label>
        <input
          value={form.siteUrl}
          onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
        />

        <label className="field-label">Cardápio (link)</label>
        <input
          value={form.menuUrl}
          onChange={(e) => setForm({ ...form, menuUrl: e.target.value })}
        />

        <label className="field-label">URLs de imagens (uma por linha)</label>
        <textarea
          rows={3}
          value={form.imageUrls}
          onChange={(e) => setForm({ ...form, imageUrls: e.target.value })}
        />

        <label className="field-label">Seu nome / atlética</label>
        <input
          value={form.submittedBy}
          onChange={(e) => setForm({ ...form, submittedBy: e.target.value })}
        />

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <button type="submit" className="btn" disabled={busy} style={{ marginTop: '1rem' }}>
          {busy ? 'Enviando…' : 'Enviar cadastro'}
        </button>
      </form>
      <style jsx global>{`
        .public-form-page {
          max-width: 520px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        .public-form-page .card {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
      `}</style>
    </main>
  );
}
