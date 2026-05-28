'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type InterEdition = {
  id: string;
  status: string;
  currentGameDayIndex: number;
  gameDays: {
    id: string;
    dayIndex: number;
    label: string;
    closedAt: string | null;
  }[];
};

export function InterControlTab({
  initialEdition,
  onReload,
}: {
  initialEdition: InterEdition;
  onReload: () => Promise<void>;
}) {
  const [edition, setEdition] = useState(initialEdition);
  const [busy, setBusy] = useState(false);
  const [confirmCloseDay, setConfirmCloseDay] = useState(false);
  const [confirmCloseInter, setConfirmCloseInter] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function closeDay() {
    setBusy(true);
    try {
      const res = await api<{
        promotion: { promoted: string[]; relegated: string[] };
      }>('/api/admin/inter/close-day', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setMessage(
        `Dia encerrado. Promovidas: ${res.promotion.promoted.length}. Rebaixadas: ${res.promotion.relegated.length}.`,
      );
      await onReload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erro ao encerrar dia');
    } finally {
      setBusy(false);
      setConfirmCloseDay(false);
    }
  }

  async function closeInter() {
    setBusy(true);
    try {
      const res = await api<{
        promotion: { promoted: string[]; relegated: string[] };
      }>('/api/admin/inter/close', { method: 'POST' });
      setEdition((e) => ({ ...e, status: 'closed' }));
      setMessage(
        `Inter encerrado. Promovidas: ${res.promotion.promoted.length}. Rebaixadas: ${res.promotion.relegated.length}.`,
      );
      await onReload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erro ao encerrar Inter');
    } finally {
      setBusy(false);
      setConfirmCloseInter(false);
    }
  }

  const currentDay = edition.gameDays.find(
    (d) => d.dayIndex === edition.currentGameDayIndex,
  );

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Controle do Inter</h3>
        <p style={{ color: 'var(--muted)' }}>
          Status:{' '}
          <strong>{edition.status === 'closed' ? 'Encerrado' : 'Ativo'}</strong>
          {' · '}
          Dia atual:{' '}
          <strong>{currentDay?.label ?? edition.currentGameDayIndex}</strong>
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          Ao encerrar um dia ou o Inter, os 3 últimos da 1ª divisão caem e os 3
          primeiros da 2ª sobem (classificação acumulada). Para ajustar divisões
          manualmente antes disso, use Classificação em Esportes.
        </p>
        {message && (
          <p className="badge" style={{ display: 'block', marginBottom: '0.75rem' }}>
            {message}
          </p>
        )}
        <div className="page-toolbar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy || edition.status === 'closed'}
            onClick={() => setConfirmCloseDay(true)}
          >
            Encerrar dia de jogos
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy || edition.status === 'closed'}
            onClick={() => setConfirmCloseInter(true)}
          >
            Encerrar Inter
          </button>
        </div>
        <ul
          style={{
            margin: '1rem 0 0',
            paddingLeft: '1.25rem',
            color: 'var(--muted)',
          }}
        >
          {edition.gameDays.map((d) => (
            <li key={d.id}>
              {d.label} — {d.closedAt ? '✓ encerrado' : 'em andamento'}
            </li>
          ))}
        </ul>
      </div>

      {confirmCloseDay && (
        <ConfirmDialog
          title="Encerrar dia de jogos?"
          message="Será aplicada promoção/rebaixamento com base na classificação atual."
          confirmLabel="Encerrar dia"
          onConfirm={closeDay}
          onCancel={() => setConfirmCloseDay(false)}
        />
      )}
      {confirmCloseInter && (
        <ConfirmDialog
          title="Encerrar o Inter?"
          message="Rodada final de promoção/rebaixamento e bloqueio de novos encerramentos automáticos."
          confirmLabel="Encerrar Inter"
          onConfirm={closeInter}
          onCancel={() => setConfirmCloseInter(false)}
        />
      )}
    </div>
  );
}
