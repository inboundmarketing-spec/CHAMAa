'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatWhatsAppText } from '@/lib/whatsapp-format';
import {
  isMoreOnlyButtonMessage,
  isMoreOptionsLabel,
  prepareDisplayMessages,
  type DisplayChatMessage,
} from '@/lib/whatsapp-display';
import type { ChatMessage } from '@/lib/chat-message';
import './whatsapp-chat.css';

export type { ChatMessage };

type Props = {
  messages: ChatMessage[];
  provider: string;
  sending?: boolean;
  onSend?: (text: string, displayText?: string) => void;
  /** Oculta o campo de envio (pré-visualização de mensagens outbound). */
  readOnly?: boolean;
  emptyHint?: string;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ButtonCard({
  buttons,
  moreButtons,
  time,
  onButtonClick,
}: {
  buttons: { id: string; title: string }[];
  moreButtons?: { id: string; title: string }[];
  time: string;
  onButtonClick: (id: string, title: string) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const extra = moreButtons ?? [];
  const hasMore = extra.length > 0;
  const useMoreToggle = hasMore && (extra.length > 1 || buttons.length > 0);

  return (
    <div className="wa-buttons">
      {buttons.map((btn) => (
        <button
          key={btn.id}
          type="button"
          className="wa-btn"
          onClick={() => onButtonClick(btn.id, btn.title)}
        >
          {btn.title}
        </button>
      ))}
      {hasMore && !useMoreToggle &&
        extra.map((btn) => (
          <button
            key={btn.id}
            type="button"
            className="wa-btn"
            onClick={() => onButtonClick(btn.id, btn.title)}
          >
            {btn.title}
          </button>
        ))}
      {useMoreToggle && (
        <>
          <button
            type="button"
            className={`wa-btn wa-btn--more${moreOpen ? ' is-open' : ''}`}
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
          >
            <span className="wa-btn-more-icon" aria-hidden>
              {moreOpen ? '▾' : '▸'}
            </span>
            Mais opções
          </button>
          {moreOpen &&
            extra.map((btn) => (
              <button
                key={btn.id}
                type="button"
                className="wa-btn"
                onClick={() => onButtonClick(btn.id, btn.title)}
              >
                {btn.title}
              </button>
            ))}
        </>
      )}
      <div className="wa-buttons-time">{time}</div>
    </div>
  );
}

function MessageBubble({
  msg,
  onButtonClick,
}: {
  msg: DisplayChatMessage;
  onButtonClick: (id: string, title: string) => void;
}) {
  const [listOpen, setListOpen] = useState(false);
  const isStudent = msg.direction === 'in';
  const rowClass = isStudent ? 'wa-msg-row--out' : 'wa-msg-row--in';
  const time = formatTime(msg.at);

  if (msg.type === 'image' && msg.imageUrl) {
    return (
      <div className={`wa-msg-row ${rowClass}`}>
        <div className="wa-msg-col">
          <div className="wa-bubble wa-bubble--media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={msg.imageUrl} alt="" />
            {msg.caption && (
              <div className="wa-bubble-caption">
                {formatWhatsAppText(msg.caption)}
              </div>
            )}
            <div className="wa-time">{time}</div>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'video' && msg.videoUrl) {
    return (
      <div className={`wa-msg-row ${rowClass}`}>
        <div className="wa-msg-col">
          <div className="wa-bubble wa-bubble--media">
            <video src={msg.videoUrl} controls style={{ maxWidth: '100%' }} />
            {msg.caption && (
              <div className="wa-bubble-caption">
                {formatWhatsAppText(msg.caption)}
              </div>
            )}
            <div className="wa-time">{time}</div>
          </div>
        </div>
      </div>
    );
  }

  const bodyText =
    msg.body?.trim() ||
    (msg.type === 'template' && msg.templateName
      ? `Template: ${msg.templateName}`
      : '');

  const showBody = bodyText.length > 0 && !isMoreOptionsLabel(msg.body);
  const mainButtons = msg.buttons ?? [];
  const hasButtons = msg.type === 'buttons' && mainButtons.length > 0;
  const mergedMore = msg.moreButtons;

  if (msg.type === 'list' && msg.listButton) {
    const listBody =
      bodyText.length > 0 && !isMoreOptionsLabel(msg.body) ? bodyText : '';
    return (
      <div className={`wa-msg-row ${rowClass}`}>
        <div className="wa-msg-col">
          <div className="wa-msg-block wa-msg-block--with-buttons">
            {listBody && (
              <div className="wa-bubble">
                {formatWhatsAppText(listBody)}
              </div>
            )}
            <button
              type="button"
              className="wa-list-btn"
              onClick={() => setListOpen((o) => !o)}
            >
              <span className="wa-list-icon" aria-hidden>
                ☰
              </span>
              {msg.listButton}
            </button>
            {listOpen && msg.sections && (
              <div className="wa-list-sheet">
                {msg.sections.map((section) => (
                  <div key={section.title}>
                    <div className="wa-list-sheet-header">{section.title}</div>
                    {section.rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        className="wa-list-row"
                        onClick={() => {
                          setListOpen(false);
                          onButtonClick(row.id, row.title);
                        }}
                      >
                        <div className="wa-list-row-title">{row.title}</div>
                        {row.description && (
                          <div className="wa-list-row-desc">
                            {row.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="wa-buttons-time wa-buttons-time--solo">{time}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`wa-msg-row ${rowClass}`}>
      <div className="wa-msg-col">
        <div
          className={`wa-msg-block${hasButtons ? ' wa-msg-block--with-buttons' : ''}`}
        >
          {showBody && (
            <div className="wa-bubble">
              {formatWhatsAppText(bodyText)}
              {!hasButtons && <div className="wa-time">{time}</div>}
            </div>
          )}

          {msg.type === 'template' && !showBody && msg.templateName && (
            <div className="wa-bubble">
              Template: {msg.templateName}
              <div className="wa-time">{time}</div>
            </div>
          )}

          {hasButtons && (
            <ButtonCard
              buttons={mainButtons}
              moreButtons={mergedMore}
              time={time}
              onButtonClick={onButtonClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function WhatsAppChat({
  messages,
  provider,
  sending,
  onSend,
  readOnly = false,
  emptyHint,
}: Props) {
  const [draft, setDraft] = useState('oi');
  const messagesRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const forceScrollRef = useRef(false);
  const displayMessages = useMemo(
    () => prepareDisplayMessages(messages),
    [messages],
  );

  const lastMessageKey =
    displayMessages.length > 0
      ? `${displayMessages.length}:${displayMessages[displayMessages.length - 1]?.at}`
      : 'empty';

  function isNearBottom(threshold = 64) {
    const el = messagesRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  function scrollToBottom(behavior: ScrollBehavior = 'auto') {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  function handleMessagesScroll() {
    stickToBottomRef.current = isNearBottom();
  }

  useEffect(() => {
    if (!stickToBottomRef.current && !forceScrollRef.current) return;
    const behavior = forceScrollRef.current ? 'smooth' : 'auto';
    forceScrollRef.current = false;
    requestAnimationFrame(() => scrollToBottom(behavior));
  }, [lastMessageKey]);

  function scrollAfterSend() {
    stickToBottomRef.current = true;
    forceScrollRef.current = true;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || readOnly || !onSend) return;
    scrollAfterSend();
    onSend(text);
    setDraft('');
  }

  function sendQuick(id: string, title: string) {
    if (readOnly || !onSend) return;
    scrollAfterSend();
    onSend(id, title);
  }

  return (
    <div className="wa-phone">
      <header className="wa-header">
        <Image
          src="/chaminha.png"
          alt=""
          width={40}
          height={40}
          className="wa-header-avatar-img"
          priority
        />
        <div>
          <div className="wa-header-title">Chaminha</div>
          <div className="wa-header-sub">
            {provider === 'preview'
              ? 'pré-visualização'
              : provider === 'dev'
                ? 'online'
                : `online · ${provider}`}
          </div>
        </div>
      </header>

      <div
        ref={messagesRef}
        className="wa-messages"
        onScroll={handleMessagesScroll}
      >
        {displayMessages.length === 0 && (
          <p className="wa-empty">
            {emptyHint ??
              (readOnly
                ? 'Nada para exibir.'
                : 'Envie "oi" para conversar com a Chaminha.')}
          </p>
        )}
        {displayMessages.map((msg, i) => (
          <MessageBubble
            key={`${msg.at}-${msg.direction}-${i}`}
            msg={msg}
            onButtonClick={sendQuick}
          />
        ))}
      </div>

      {!readOnly && (
        <form className="wa-compose" onSubmit={submit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Mensagem"
            aria-label="Mensagem do estudante"
          />
          <button
            type="submit"
            className="wa-compose-send"
            disabled={!draft.trim()}
            aria-label="Enviar"
          >
            ➤
          </button>
        </form>
      )}
    </div>
  );
}
