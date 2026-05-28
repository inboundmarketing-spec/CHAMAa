'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { api } from '@/lib/api';
import { formatWhatsAppText } from '@/lib/whatsapp-format';
import '../whatsapp-chat.css';
import './handoff.css';

type WaUserRef = {
  id: string;
  waId: string;
  name?: string | null;
};

type OpenSession = {
  id: string;
  waUserId: string;
  waUser: WaUserRef;
  lastMessageAt: string;
};

type ClosedItem = {
  waUserId: string;
  waUser: WaUserRef;
  messageCount: number;
  lastMessageAt: string;
  closedAt: string;
};

type Message = {
  id: string;
  direction: string;
  content: string;
  createdAt: string;
};

type DeskTab = 'open' | 'closed';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function userDisplayName(u: WaUserRef) {
  return u.name?.trim() || formatWaId(u.waId);
}

function formatWaId(waId: string) {
  const digits = waId.replace(/\D/g, '');
  if (digits.length >= 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return waId;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function isSosSystemMessage(content: string) {
  return content.includes('[SOS]');
}

function HandoffBubble({ msg }: { msg: Message }) {
  const fromUser = msg.direction === 'inbound';
  const rowClass = fromUser ? 'wa-msg-row--out' : 'wa-msg-row--in';
  const sos = isSosSystemMessage(msg.content);

  return (
    <div className={`wa-msg-row ${rowClass}`}>
      <div className="wa-msg-col">
        <div className={`wa-bubble${sos ? ' handoff-bubble--sos' : ''}`}>
          {formatWhatsAppText(msg.content)}
          <div className="wa-time">{formatTime(msg.createdAt)}</div>
        </div>
      </div>
    </div>
  );
}

export function HandoffDesk() {
  const [tab, setTab] = useState<DeskTab>('open');
  const [queue, setQueue] = useState<OpenSession[]>([]);
  const [history, setHistory] = useState<ClosedItem[]>([]);
  const [historyQuery, setHistoryQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const readOnly = tab === 'closed';

  const loadQueue = useCallback(() => {
    return api<OpenSession[]>('/api/admin/handoff').then(setQueue);
  }, []);

  const loadHistory = useCallback((q?: string) => {
    const params = new URLSearchParams();
    if (q?.trim()) params.set('q', q.trim());
    const qs = params.toString();
    return api<ClosedItem[]>(
      `/api/admin/handoff/history${qs ? `?${qs}` : ''}`,
    ).then(setHistory);
  }, []);

  const loadMessages = useCallback((waUserId: string) => {
    return api<Message[]>(`/api/admin/handoff/${waUserId}/messages`).then(
      setMessages,
    );
  }, []);

  useEffect(() => {
    if (tab !== 'open') return;
    loadQueue().catch(console.error);
    const t = setInterval(() => loadQueue().catch(console.error), 5000);
    return () => clearInterval(t);
  }, [tab, loadQueue]);

  useEffect(() => {
    if (tab !== 'closed') return;
    const t = setTimeout(() => {
      loadHistory(historyQuery).catch(console.error);
    }, historyQuery ? 300 : 0);
    return () => clearTimeout(t);
  }, [tab, historyQuery, loadHistory]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    loadMessages(selected).catch(console.error);
    if (readOnly) return;
    const t = setInterval(
      () => loadMessages(selected).catch(console.error),
      4000,
    );
    return () => clearInterval(t);
  }, [selected, loadMessages, readOnly]);

  useEffect(() => {
    if (tab === 'open' && queue.length > 0) {
      setSelected((prev) => {
        if (prev && queue.some((s) => s.waUserId === prev)) return prev;
        return queue[0].waUserId;
      });
      return;
    }
    if (tab === 'closed' && history.length > 0) {
      setSelected((prev) => {
        if (prev && history.some((h) => h.waUserId === prev)) return prev;
        return history[0].waUserId;
      });
      return;
    }
    if (tab === 'closed') {
      setSelected(null);
    }
  }, [tab, queue, history]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, selected]);

  const openSession =
    queue.find((s) => s.waUserId === selected) ?? null;
  const closedItem =
    history.find((h) => h.waUserId === selected) ?? null;
  const activeUser =
    openSession?.waUser ?? closedItem?.waUser ?? null;
  const closedMeta = closedItem;

  function switchTab(next: DeskTab) {
    setTab(next);
    setSelected(null);
    setReply('');
  }

  async function sendReply() {
    const text = reply.trim();
    if (!selected || !text || sending || readOnly) return;
    setSending(true);
    try {
      await api(`/api/admin/handoff/${selected}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      setReply('');
      await loadMessages(selected);
      loadQueue().catch(console.error);
    } finally {
      setSending(false);
    }
  }

  async function closeSession() {
    if (!selected) return;
    await api(`/api/admin/handoff/${selected}/close`, { method: 'PATCH' });
    setSelected(null);
    setCloseConfirm(false);
    await loadQueue();
    loadHistory().catch(console.error);
  }

  function onReplyKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendReply();
    }
  }

  const listEmpty =
    tab === 'open' ? queue.length === 0 : history.length === 0;

  return (
    <div className="handoff-page">
      <header className="handoff-header">
        <div>
          <h1>Atendimento humano (SOS)</h1>
          <p>
            Conversas em modo Lieu no WhatsApp. Responda pelo painel; ao
            encerrar, o estudante volta ao menu automático. Consulte atendimentos
            encerrados na aba Histórico.
          </p>
        </div>
        <span
          className={`handoff-stat${tab === 'open' && queue.length === 0 ? ' handoff-stat--empty' : ''}`}
        >
          {tab === 'open'
            ? queue.length === 0
              ? 'Fila vazia'
              : `${queue.length} na fila`
            : `${history.length} encerrado${history.length === 1 ? '' : 's'}`}
        </span>
      </header>

      <div className="handoff-layout">
        <aside className="card handoff-queue">
          <div className="handoff-queue-head">
            <h3>Atendimentos</h3>
            <div className="handoff-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'open'}
                className={`handoff-tab${tab === 'open' ? ' is-active' : ''}`}
                onClick={() => switchTab('open')}
              >
                Abertos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'closed'}
                className={`handoff-tab${tab === 'closed' ? ' is-active' : ''}`}
                onClick={() => switchTab('closed')}
              >
                Encerrados
              </button>
            </div>
            {tab === 'closed' && (
              <input
                type="search"
                className="handoff-search"
                placeholder="Buscar nome ou número…"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                aria-label="Buscar atendimentos encerrados"
              />
            )}
          </div>
          <div className="handoff-queue-list">
            {listEmpty && tab === 'open' && (
              <p className="handoff-queue-empty">
                Nenhum atendimento aberto. Quando alguém tocar em SOS Lieu no
                bot, aparece aqui.
              </p>
            )}
            {listEmpty && tab === 'closed' && (
              <p className="handoff-queue-empty">
                {historyQuery
                  ? 'Nenhum resultado para essa busca.'
                  : 'Nenhum atendimento encerrado registrado ainda.'}
              </p>
            )}
            {tab === 'open' &&
              queue.map((s) => {
                const name = userDisplayName(s.waUser);
                const active = selected === s.waUserId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`handoff-queue-item${active ? ' is-active' : ''}`}
                    onClick={() => setSelected(s.waUserId)}
                  >
                    <span className="handoff-avatar" aria-hidden>
                      {initials(name)}
                    </span>
                    <span className="handoff-queue-meta">
                      <span className="handoff-queue-name">{name}</span>
                      <span className="handoff-queue-sub">
                        {formatWaId(s.waUser.waId)}
                      </span>
                      <span className="handoff-sos-pill">SOS Lieu</span>
                    </span>
                    <span className="handoff-queue-time">
                      {formatRelative(s.lastMessageAt)}
                    </span>
                  </button>
                );
              })}
            {tab === 'closed' &&
              history.map((h) => {
                const name = userDisplayName(h.waUser);
                const active = selected === h.waUserId;
                return (
                  <button
                    key={h.waUserId}
                    type="button"
                    className={`handoff-queue-item${active ? ' is-active' : ''}`}
                    onClick={() => setSelected(h.waUserId)}
                  >
                    <span className="handoff-avatar" aria-hidden>
                      {initials(name)}
                    </span>
                    <span className="handoff-queue-meta">
                      <span className="handoff-queue-name">{name}</span>
                      <span className="handoff-queue-sub">
                        {formatWaId(h.waUser.waId)} · {h.messageCount} msgs
                      </span>
                      <span className="handoff-closed-pill">Encerrado</span>
                    </span>
                    <span className="handoff-queue-time">
                      {formatRelative(h.closedAt)}
                    </span>
                  </button>
                );
              })}
          </div>
        </aside>

        <section className="handoff-panel">
          {!activeUser ? (
            <div className="handoff-panel-empty">
              <strong>
                {tab === 'open'
                  ? 'Selecione um atendimento'
                  : 'Consultar histórico'}
              </strong>
              <span>
                {tab === 'open'
                  ? 'Escolha alguém na fila à esquerda para ver o histórico e responder.'
                  : 'Escolha um atendimento encerrado para revisar as mensagens.'}
              </span>
            </div>
          ) : (
            <div className="handoff-chat wa-phone">
              <header className="wa-header">
                <span className="handoff-avatar" aria-hidden>
                  {initials(userDisplayName(activeUser))}
                </span>
                <div>
                  <div className="wa-header-title">
                    {userDisplayName(activeUser)}
                  </div>
                  <div className="wa-header-sub">
                    {formatWaId(activeUser.waId)}
                    {readOnly && closedMeta
                      ? ` · encerrado ${formatDateTime(closedMeta.closedAt)}`
                      : ' · modo Lieu'}
                  </div>
                </div>
              </header>

              {readOnly && (
                <div className="handoff-readonly-banner">
                  Atendimento encerrado — somente leitura
                </div>
              )}

              <div ref={messagesRef} className="wa-messages">
                {messages.length === 0 && (
                  <p className="wa-empty">Nenhuma mensagem ainda.</p>
                )}
                {messages.map((m) => (
                  <HandoffBubble key={m.id} msg={m} />
                ))}
              </div>

              {!readOnly && (
                <div className="handoff-compose-wrap">
                  {sending && (
                    <div className="handoff-sending">Enviando…</div>
                  )}
                  <textarea
                    placeholder="Resposta da comissão…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={onReplyKeyDown}
                    disabled={sending}
                    aria-label="Resposta da comissão"
                  />
                  <div className="handoff-compose-actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => void sendReply()}
                      disabled={sending || !reply.trim()}
                    >
                      Enviar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setCloseConfirm(true)}
                      disabled={sending}
                    >
                      Encerrar
                    </button>
                    <span className="handoff-compose-hint">
                      Enter envia · Shift+Enter quebra linha
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {closeConfirm && openSession && (
        <ConfirmDialog
          title="Encerrar atendimento?"
          message={`O modo Lieu será desligado para ${userDisplayName(openSession.waUser)}. O bot enviará uma mensagem de encerramento no WhatsApp.`}
          confirmLabel="Encerrar"
          cancelLabel="Continuar atendendo"
          danger
          onConfirm={closeSession}
          onCancel={() => setCloseConfirm(false)}
        />
      )}
    </div>
  );
}
