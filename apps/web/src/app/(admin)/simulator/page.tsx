'use client';

import { useCallback, useEffect, useState } from 'react';
import { WhatsAppChat, type ChatMessage } from '@/components/WhatsAppChat';
import { getApiBase } from '@/lib/api';
import { isApiReady, waitForApiReady } from '@/lib/api-health';

export default function SimulatorPage() {
  const [waId, setWaId] = useState('5511999999999');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [provider, setProvider] = useState('');
  const [llmStatus, setLlmStatus] = useState<{
    enabled: boolean;
    hint: string;
    model?: string;
  } | null>(null);
  const [apiReady, setApiReady] = useState(false);

  const normalizedWaId = waId.replace(/\D/g, '');

  const refreshLog = useCallback(async () => {
    if (!(await isApiReady())) return;
    try {
      const q = normalizedWaId
        ? `?waId=${encodeURIComponent(normalizedWaId)}`
        : '';
      const res = await fetch(`${getApiBase()}/api/dev/chat-log${q}`);
      if (!res.ok) return;
      const data = (await res.json()) as ChatMessage[];
      setMessages(data);
    } catch {
      /* API reiniciando */
    }
  }, [normalizedWaId]);

  const loadProvider = useCallback(async () => {
    if (!(await isApiReady())) return;
    try {
      const [provRes, llmRes] = await Promise.all([
        fetch(`${getApiBase()}/api/dev/provider`),
        fetch(`${getApiBase()}/api/dev/help-llm-status`),
      ]);
      if (!provRes.ok) return;
      const data = await provRes.json();
      setProvider(data.active);
      if (llmRes.ok) {
        setLlmStatus(await llmRes.json());
      }
    } catch {
      /* API reiniciando */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    void (async () => {
      const ready = await waitForApiReady();
      if (cancelled) return;
      setApiReady(ready);
      if (!ready) return;
      await loadProvider();
      await refreshLog();
      if (cancelled) return;
      const pollMs = document.hidden ? 5000 : 2500;
      interval = setInterval(() => {
        if (!document.hidden) {
          refreshLog().catch(() => {});
        }
      }, pollMs);
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [loadProvider, refreshLog]);

  async function resetConversation() {
    if (!normalizedWaId) return;
    await fetch(`${getApiBase()}/api/dev/reset-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waId: normalizedWaId }),
    });
    setMessages([]);
  }

  async function send(text: string, displayText?: string) {
    if (!normalizedWaId) return;
    await fetch(`${getApiBase()}/api/dev/simulate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waId: normalizedWaId,
        text,
        displayText,
      }),
    });
    await refreshLog();
    void (async () => {
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 500));
        await refreshLog();
      }
    })();
  }

  return (
    <div>
      <h1>Simulador WhatsApp</h1>
      <p className="page-muted">
        Protótipo para apresentação — provedor ativo:{' '}
        <strong>{provider || '…'}</strong>. Visual igual ao app da{' '}
        <strong>chaminha</strong>; clique nos botões para simular toques.
        Migração: <code>WHATSAPP_PROVIDER=cloud</code>.
      </p>
      {!apiReady && (
        <p className="page-muted" style={{ color: 'var(--warn, #eab308)' }}>
          Aguardando a API em <strong>http://127.0.0.1:3001</strong>… (normal nos
          primeiros ~15 s após <code>npm run dev</code>)
        </p>
      )}
      {llmStatus && (
        <p
          className="page-muted"
          style={{
            marginTop: '-0.5rem',
            color: llmStatus.enabled ? 'var(--success, #22c55e)' : 'var(--warn, #eab308)',
          }}
        >
          IA da Ajuda:{' '}
          <strong>{llmStatus.enabled ? 'ativa' : 'inativa'}</strong>
          {llmStatus.model && llmStatus.enabled && (
            <> ({llmStatus.model})</>
          )}
          {!llmStatus.enabled && <> — {llmStatus.hint}</>}
        </p>
      )}

      <div className="page-split">
        <div className="page-split-side">
          <label style={{ display: 'block', marginBottom: '0.35rem' }}>
            Número (waId)
          </label>
          <input
            value={waId}
            onChange={(e) => setWaId(e.target.value)}
            style={{ maxWidth: 220, marginBottom: '0.75rem' }}
          />
          <button
            type="button"
            className="btn-secondary btn"
            onClick={resetConversation}
          >
            Nova conversa
          </button>
          <p className="page-muted-narrow">
            Zera sessão e modo Lieu. Após SOS, use aqui para o bot voltar a
            responder.
          </p>
        </div>

        <WhatsAppChat
          messages={messages}
          provider={provider}
          onSend={send}
        />
      </div>
    </div>
  );
}
