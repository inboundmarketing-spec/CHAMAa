'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { INCIDENT_TYPE_LABELS } from '@/lib/sports-labels';
import { getAdminUser } from '@/lib/admin-user';

type Incident = {
  id: string;
  type: string;
  description: string;
  athleteName?: string | null;
  team?: string | null;
  minute?: number | null;
  actionTaken?: string | null;
  reportedBy?: string | null;
  gameStartedAt?: string | null;
  gameEndedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatGameTime(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const EMPTY_FORM = {
  type: 'injury',
  description: '',
  athleteName: '',
  team: '',
  minute: '',
  actionTaken: '',
};

function incidentToForm(incident: Incident) {
  return {
    type: incident.type,
    description: incident.description,
    athleteName: incident.athleteName ?? '',
    team: incident.team ?? '',
    minute: incident.minute != null ? String(incident.minute) : '',
    actionTaken: incident.actionTaken ?? '',
  };
}

export function IncidentPanel({
  matchId,
  matchLabel,
  onSaved,
  variant = 'modal',
  hasIncident = false,
  triggerStyle = 'link',
  actionLabel,
  triggerPrimary = false,
}: {
  matchId: string;
  matchLabel: string;
  onSaved?: () => void;
  variant?: 'modal' | 'inline';
  hasIncident?: boolean;
  triggerStyle?: 'link' | 'button';
  actionLabel?: string;
  triggerPrimary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  const exists = Boolean(incident) || hasIncident;

  async function load() {
    const data = await api<Incident | null>(
      `/api/admin/matches/${matchId}/incidents`,
    );
    setIncident(data ?? null);
    setForm(data ? incidentToForm(data) : EMPTY_FORM);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) load().catch(console.error);
  }, [open, matchId]);

  useEffect(() => {
    if (!open || variant !== 'modal') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, variant]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const user = getAdminUser();
      const saved = await api<Incident>(`/api/admin/matches/${matchId}/incidents`, {
        method: 'PUT',
        body: JSON.stringify({
          type: form.type,
          description: form.description,
          athleteName: form.athleteName || undefined,
          team: form.team || undefined,
          minute: form.minute ? Number(form.minute) : undefined,
          actionTaken: form.actionTaken || undefined,
          reportedBy: user?.name,
        }),
      });
      setIncident(saved);
      setForm(incidentToForm(saved));
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  const panel = (
    <div className={variant === 'modal' ? 'incident-modal' : 'incident-inline'}>
      <div className="incident-modal-header">
        <div>
          <h4>Ficha de intercorrência</h4>
          <p className="incident-modal-subtitle">{matchLabel}</p>
        </div>
        <button
          type="button"
          className="btn-icon"
          onClick={() => setOpen(false)}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      {exists && incident && (
        <p className="incident-edit-hint">
          Ficha registrada em{' '}
          {new Date(incident.createdAt).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {incident.updatedAt !== incident.createdAt && (
            <>
              {' '}
              · atualizada em{' '}
              {new Date(incident.updatedAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </>
          )}
        </p>
      )}

      {(incident?.gameStartedAt || incident?.gameEndedAt) && (
        <div className="incident-game-times">
          {incident?.gameStartedAt && (
            <p style={{ margin: '0.35rem 0', fontSize: '0.9rem' }}>
              <strong>Início do jogo:</strong>{' '}
              {formatGameTime(incident.gameStartedAt)}
            </p>
          )}
          {incident?.gameEndedAt && (
            <p style={{ margin: '0.35rem 0', fontSize: '0.9rem' }}>
              <strong>Fim do jogo:</strong>{' '}
              {formatGameTime(incident.gameEndedAt)}
            </p>
          )}
        </div>
      )}

      <form className="incident-form" onSubmit={submit}>
        <div className="form-grid form-grid-tight">
          <div>
            <label className="field-label">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {Object.entries(INCIDENT_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Minuto</label>
            <input
              type="number"
              min={0}
              placeholder="-"
              value={form.minute}
              onChange={(e) => setForm({ ...form, minute: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Atleta</label>
            <input
              placeholder="Opcional"
              value={form.athleteName}
              onChange={(e) =>
                setForm({ ...form, athleteName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="field-label">Time / atlética</label>
            <input
              placeholder="Opcional"
              value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
            />
          </div>
        </div>

        <label className="field-label">Descrição</label>
        <textarea
          required
          rows={2}
          className="field-compact"
          placeholder="Descreva o ocorrido..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label className="field-label">Providências</label>
        <textarea
          rows={2}
          className="field-compact"
          placeholder="Atendimento, substituição, pausa..."
          value={form.actionTaken}
          onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
        />

        <button type="submit" className="btn btn-sm" disabled={saving}>
          {exists ? 'Salvar alterações' : 'Registrar ficha'}
        </button>
      </form>
    </div>
  );

  const triggerLabel =
    open && variant === 'inline'
      ? 'Fechar ficha'
      : exists
        ? 'Ver ficha'
        : (actionLabel ??
          (triggerStyle === 'button' ? 'Intercorrências' : 'Registrar ficha'));

  return (
    <>
      <button
        type="button"
        className={
          triggerStyle === 'button'
            ? `btn btn-sm match-action-btn${triggerPrimary ? '' : ' btn-secondary'}`
            : 'btn-link'
        }
        onClick={() => setOpen(variant === 'inline' ? !open : true)}
      >
        {triggerLabel}
        {exists && !open && (
          <span className="badge badge-sm badge-ok" aria-label="Ficha registrada" />
        )}
      </button>

      {open && variant === 'inline' && panel}

      {open &&
        variant === 'modal' &&
        mounted &&
        createPortal(
          <div
            className="incident-overlay"
            onClick={() => setOpen(false)}
            role="presentation"
          >
            <div onClick={(e) => e.stopPropagation()} role="dialog">
              {panel}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
