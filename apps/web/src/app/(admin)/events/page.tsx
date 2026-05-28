'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, apiForm } from '@/lib/api';
import { PageSkeleton } from '@/components/PageSkeleton';
import { canManageFestas, useAdminUser } from '@/lib/admin-user';

type Location = { id: string; name: string; address: string; mapUrl?: string | null };

type FestivalMedia = {
  id: string;
  type: string;
  url: string;
  caption?: string | null;
};

type FestivalArtist = {
  id: string;
  name: string;
  role: string;
  sortOrder: number;
  setStartsAt: string | null;
  media: FestivalMedia[];
};

type FestivalDay = {
  id: string;
  dayIndex: number;
  title: string;
  startsAt: string;
  endsAt: string;
  artists: FestivalArtist[];
  media: FestivalMedia[];
};

type Festival = {
  id: string;
  name: string;
  promoVideoUrl: string | null;
  promoImageUrl: string | null;
  address: string | null;
  mapUrl: string | null;
  passportPurchaseUrl: string | null;
  locationId: string | null;
  location: Location | null;
  days: FestivalDay[];
  media: FestivalMedia[];
};

type DayForm = { id?: string; title: string; startsAt: string };

function defaultDayForms(): Record<number, DayForm> {
  return {
    1: { title: 'Dia 1', startsAt: '' },
    2: { title: 'Dia 2', startsAt: '' },
    3: { title: 'Dia 3', startsAt: '' },
  };
}

function dayFormsFromFestival(days: FestivalDay[]): Record<number, DayForm> {
  const forms = defaultDayForms();
  for (const d of days) {
    forms[d.dayIndex] = {
      id: d.id,
      title: d.title,
      startsAt: toLocalInput(d.startsAt),
    };
  }
  return forms;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatEndsAt(startsAtLocal: string) {
  if (!startsAtLocal) return null;
  const start = new Date(startsAtLocal);
  const end = new Date(start.getTime() + 12 * 60 * 60 * 1000);
  return end.toLocaleString('pt-BR');
}

function mediaSrc(url: string) {
  return url.startsWith('http') ? url : url;
}

type FestaModal =
  | {
      type: 'link';
      key: string;
      scope: 'festival' | 'day' | 'artist';
      targetId: string;
    }
  | { type: 'artist'; dayId: string };

function partitionArtists(artists: FestivalArtist[]) {
  const headliners = artists
    .filter((a) => a.role === 'headliner')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const supporting = artists
    .filter((a) => a.role !== 'headliner')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return { headliners, supporting };
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: '0.85rem',
        color: 'var(--muted)',
        marginTop: '0.75rem',
        marginBottom: '0.25rem',
      }}
    >
      {children}
    </label>
  );
}

export default function EventsPage() {
  const user = useAdminUser();
  const allowed = canManageFestas(user);
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    mapUrl: '',
    passportPurchaseUrl: '',
  });
  const [dayForms, setDayForms] = useState<Record<number, DayForm>>(defaultDayForms);
  const [linkForms, setLinkForms] = useState<
    Record<string, { url: string; caption: string }>
  >({});
  const [artistForms, setArtistForms] = useState<
    Record<string, { name: string; role: string; setStartsAt: string }>
  >({});
  const [modal, setModal] = useState<FestaModal | null>(null);

  const load = useCallback(async () => {
    const f = await api<Festival>('/api/admin/festas');
    setFestival(f);
    setDayForms(dayFormsFromFestival(f.days));
    setSettings({
      name: f.name,
      address: f.address ?? f.location?.address ?? '',
      mapUrl: f.mapUrl ?? f.location?.mapUrl ?? '',
      passportPurchaseUrl: f.passportPurchaseUrl ?? '',
    });
  }, []);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    load()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [load, allowed]);

  if (!allowed) {
    return (
      <div>
        <h1>Festas do Inter</h1>
        <p className="card" style={{ marginTop: '1rem', color: 'var(--muted)' }}>
          Acesso restrito à equipe de comunicação (administrador, mesa Lieu ou
          criativa).
        </p>
      </div>
    );
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    await api('/api/admin/festas', {
      method: 'PATCH',
      body: JSON.stringify({
        name: settings.name,
        address: settings.address || null,
        mapUrl: settings.mapUrl || null,
        passportPurchaseUrl: settings.passportPurchaseUrl || null,
        locationId: null,
      }),
    });
    load();
  }

  async function saveDaySchedule(dayIndex: number) {
    const form = dayForms[dayIndex];
    if (!form.startsAt) {
      alert('Informe a data e o horário de início do dia.');
      return;
    }
    const payload = {
      title: form.title.trim() || `Dia ${dayIndex}`,
      startsAt: new Date(form.startsAt).toISOString(),
    };
    if (form.id) {
      await api(`/api/admin/festas/days/${form.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      await api('/api/admin/festas/days', {
        method: 'POST',
        body: JSON.stringify({ dayIndex, ...payload }),
      });
    }
    load();
  }

  async function addLink(
    scope: 'festival' | 'day' | 'artist',
    targetId: string,
    key: string,
  ) {
    const form = linkForms[key] ?? { url: '', caption: '' };
    if (!form.url.trim()) return;
    await api('/api/admin/festas/media/link', {
      method: 'POST',
      body: JSON.stringify({
        scope,
        targetId,
        url: form.url.trim(),
        caption: form.caption.trim() || undefined,
      }),
    });
    setLinkForms((prev) => ({ ...prev, [key]: { url: '', caption: '' } }));
    load();
  }

  async function uploadMedia(
    scope: 'festival' | 'day' | 'artist',
    targetId: string,
    file: File,
  ) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('scope', scope);
    fd.append('targetId', targetId);
    await apiForm('/api/admin/festas/media/upload', fd);
    load();
  }

  async function removeMedia(id: string) {
    if (!confirm('Excluir esta mídia?')) return;
    await api(`/api/admin/festas/media/${id}`, { method: 'DELETE' });
    load();
  }

  async function removeDay(id: string) {
    if (!confirm('Excluir este dia e todos os artistas/mídias?')) return;
    await api(`/api/admin/festas/days/${id}`, { method: 'DELETE' });
    load();
  }

  function openAddArtistModal(dayId: string) {
    setArtistForms((prev) => ({
      ...prev,
      [dayId]: prev[dayId] ?? {
        name: '',
        role: 'supporting',
        setStartsAt: '',
      },
    }));
    setModal({ type: 'artist', dayId });
  }

  async function addArtist(dayId: string) {
    const form = artistForms[dayId] ?? {
      name: '',
      role: 'supporting',
      setStartsAt: '',
    };
    if (!form.name.trim()) return;
    await api(`/api/admin/festas/days/${dayId}/artists`, {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        role: form.role,
        setStartsAt: form.setStartsAt
          ? new Date(form.setStartsAt).toISOString()
          : undefined,
      }),
    });
    setArtistForms((prev) => ({
      ...prev,
      [dayId]: { name: '', role: 'supporting', setStartsAt: '' },
    }));
    setModal(null);
    load();
  }

  function openLinkModal(
    key: string,
    scope: 'festival' | 'day' | 'artist',
    targetId: string,
  ) {
    setLinkForms((prev) => ({
      ...prev,
      [key]: prev[key] ?? { url: '', caption: '' },
    }));
    setModal({ type: 'link', key, scope, targetId });
  }

  async function submitLinkModal() {
    if (!modal || modal.type !== 'link') return;
    await addLink(modal.scope, modal.targetId, modal.key);
    setModal(null);
  }

  async function removeArtist(id: string) {
    if (!confirm('Excluir este artista?')) return;
    await api(`/api/admin/festas/artists/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <PageSkeleton />;
  if (!festival) return null;

  const dayByIndex = (index: number) =>
    festival.days.find((d) => d.dayIndex === index);

  return (
    <div>
      <h1>Festas do Inter</h1>
      <p className="page-intro">
        Configure nome da festa, local, os 3 dias (~12h cada) com data e horário,
        line-up e mídias exibidas no bot.
      </p>

      <form className="card" style={{ marginTop: '1rem' }} onSubmit={saveSettings}>
        <h3 style={{ marginTop: 0 }}>Identidade da festa</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 0 }}>
          Nome exibido no bot — geralmente a cidade sede (ex.: Passaporte
          O&apos;Inter São Vicente).
        </p>
        <input
          placeholder="Nome da festa"
          value={settings.name}
          onChange={(e) => setSettings({ ...settings, name: e.target.value })}
        />

        <h4 style={{ marginTop: '1.25rem' }}>Local da festa</h4>
        <FieldLabel htmlFor="festa-address">Endereço</FieldLabel>
        <textarea
          id="festa-address"
          placeholder="Endereço completo do local da festa"
          rows={2}
          value={settings.address}
          onChange={(e) =>
            setSettings({ ...settings, address: e.target.value })
          }
        />
        <FieldLabel htmlFor="festa-map">Link do mapa</FieldLabel>
        <input
          id="festa-map"
          placeholder="https://maps.google.com/…"
          value={settings.mapUrl}
          onChange={(e) => setSettings({ ...settings, mapUrl: e.target.value })}
        />

        <h4 style={{ marginTop: '1.25rem' }}>Passaporte</h4>
        <input
          placeholder="Link de compra do passaporte"
          value={settings.passportPurchaseUrl}
          onChange={(e) =>
            setSettings({ ...settings, passportPurchaseUrl: e.target.value })
          }
        />
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          O bot exibe o botão &quot;Passaporte&quot; quando este link está
          preenchido.
        </p>

        <button type="submit" className="btn" style={{ marginTop: '0.75rem' }}>
          Salvar identidade e local
        </button>
      </form>

      {[1, 2, 3].map((dayIndex) => {
        const day = dayByIndex(dayIndex);
        const form = dayForms[dayIndex];
        const endsAt = formatEndsAt(form.startsAt);

        return (
          <div className="card" style={{ marginTop: '1.5rem' }} key={dayIndex}>
            <h3 style={{ marginTop: 0 }}>Dia {dayIndex}</h3>

            <FieldLabel htmlFor={`day-${dayIndex}-starts`}>
              Data e horário de início
            </FieldLabel>
            <input
              id={`day-${dayIndex}-starts`}
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) =>
                setDayForms({
                  ...dayForms,
                  [dayIndex]: { ...form, startsAt: e.target.value },
                })
              }
            />
            {endsAt && (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Término previsto: {endsAt} (12h após o início)
              </p>
            )}

            <FieldLabel htmlFor={`day-${dayIndex}-title`}>Título do dia</FieldLabel>
            <input
              id={`day-${dayIndex}-title`}
              placeholder={`Dia ${dayIndex}`}
              value={form.title}
              onChange={(e) =>
                setDayForms({
                  ...dayForms,
                  [dayIndex]: { ...form, title: e.target.value },
                })
              }
            />

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn"
                onClick={() => saveDaySchedule(dayIndex)}
              >
                {day ? 'Salvar data e horário' : `Cadastrar dia ${dayIndex}`}
              </button>
              {day && (
                <button
                  type="button"
                  className="btn-secondary btn"
                  onClick={() => removeDay(day.id)}
                >
                  Excluir dia
                </button>
              )}
            </div>

            {!day ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
                Salve a data e o horário para adicionar artistas e mídias.
              </p>
            ) : (
              <>
                <h4 style={{ marginTop: '1.25rem' }}>Mídia e links do dia</h4>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>
                  Imagem, vídeo ou link exibidos no bot para este dia.
                </p>
                {day.media.map((m) => (
                  <MediaPreview
                    key={m.id}
                    media={m}
                    onDelete={() => removeMedia(m.id)}
                  />
                ))}
                <div className="artist-actions" style={{ marginTop: '0.5rem' }}>
                  <label className="btn-secondary btn btn-sm">
                    + Imagem/vídeo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMedia('day', day.id, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-secondary btn btn-sm"
                    onClick={() => openLinkModal(`day-${day.id}`, 'day', day.id)}
                  >
                    + Adicionar link
                  </button>
                </div>

                <h4 style={{ marginTop: '1.5rem' }}>Artistas</h4>
                {(() => {
                  const { headliners, supporting } = partitionArtists(day.artists);
                  return (
                    <>
                      <ArtistRoleSection
                        variant="headliner"
                        title="Headliner"
                        emptyHint="Nenhum headliner neste dia."
                        artists={headliners}
                        onUploadMedia={(artistId, file) =>
                          uploadMedia('artist', artistId, file)
                        }
                        onAddLink={(artistId) =>
                          openLinkModal(`artist-${artistId}`, 'artist', artistId)
                        }
                        onRemoveArtist={removeArtist}
                        onRemoveMedia={removeMedia}
                      />
                      <ArtistRoleSection
                        variant="support"
                        title="Atrações de apoio"
                        emptyHint="Nenhuma atração de apoio neste dia."
                        artists={supporting}
                        onUploadMedia={(artistId, file) =>
                          uploadMedia('artist', artistId, file)
                        }
                        onAddLink={(artistId) =>
                          openLinkModal(`artist-${artistId}`, 'artist', artistId)
                        }
                        onRemoveArtist={removeArtist}
                        onRemoveMedia={removeMedia}
                      />
                      <button
                        type="button"
                        className="btn"
                        style={{ marginTop: '1rem' }}
                        onClick={() => openAddArtistModal(day.id)}
                      >
                        + Adicionar artista
                      </button>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        );
      })}

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Vídeo / imagem — os 3 dias</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Enviado quando o usuário toca em &quot;Vídeo promo&quot; no bot.
        </p>
        {(festival.promoVideoUrl || festival.promoImageUrl) && (
          <div style={{ marginBottom: '0.75rem' }}>
            {festival.promoVideoUrl ? (
              <video
                src={mediaSrc(festival.promoVideoUrl)}
                controls
                style={{ maxWidth: '100%', maxHeight: 240 }}
              />
            ) : festival.promoImageUrl ? (
              <img
                src={mediaSrc(festival.promoImageUrl)}
                alt="Promo"
                style={{ maxWidth: '100%', maxHeight: 240 }}
              />
            ) : null}
          </div>
        )}
        <div className="artist-actions" style={{ marginTop: '0.5rem' }}>
          <label className="btn-secondary btn btn-sm">
            Enviar vídeo ou imagem
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMedia('festival', festival.id, file);
                e.target.value = '';
              }}
            />
          </label>
          <button
            type="button"
            className="btn-secondary btn btn-sm"
            onClick={() => openLinkModal('festival', 'festival', festival.id)}
          >
            + Adicionar link
          </button>
        </div>
        {festival.media.map((m) => (
          <div key={m.id} style={{ marginTop: '0.5rem' }}>
            <MediaPreview media={m} onDelete={() => removeMedia(m.id)} />
          </div>
        ))}
      </div>

      {modal?.type === 'link' && (
        <FestaModal
          title="Adicionar link"
          subtitle="O link é enviado como mensagem no bot."
          onClose={() => setModal(null)}
        >
          <div className="festa-modal-form">
            <FieldLabel htmlFor="festa-link-url">URL</FieldLabel>
            <input
              id="festa-link-url"
              placeholder="https://…"
              value={linkForms[modal.key]?.url ?? ''}
              onChange={(e) =>
                setLinkForms({
                  ...linkForms,
                  [modal.key]: {
                    ...(linkForms[modal.key] ?? { url: '', caption: '' }),
                    url: e.target.value,
                  },
                })
              }
            />
            <FieldLabel htmlFor="festa-link-caption">
              Rótulo do link (opcional)
            </FieldLabel>
            <input
              id="festa-link-caption"
              placeholder="Ex.: Ingressos, Aftermovie…"
              value={linkForms[modal.key]?.caption ?? ''}
              onChange={(e) =>
                setLinkForms({
                  ...linkForms,
                  [modal.key]: {
                    ...(linkForms[modal.key] ?? { url: '', caption: '' }),
                    caption: e.target.value,
                  },
                })
              }
            />
            <div className="festa-modal-actions">
              <button
                type="button"
                className="btn-secondary btn"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => submitLinkModal()}
                disabled={!linkForms[modal.key]?.url?.trim()}
              >
                Salvar link
              </button>
            </div>
          </div>
        </FestaModal>
      )}

      {modal?.type === 'artist' && (
        <FestaModal
          title="Adicionar artista"
          subtitle="Escolha se é headliner ou atração de apoio."
          onClose={() => setModal(null)}
        >
          <div className="festa-modal-form">
            <FieldLabel htmlFor="festa-artist-name">Nome</FieldLabel>
            <input
              id="festa-artist-name"
              placeholder="Nome do artista"
              value={artistForms[modal.dayId]?.name ?? ''}
              onChange={(e) =>
                setArtistForms({
                  ...artistForms,
                  [modal.dayId]: {
                    ...(artistForms[modal.dayId] ?? {
                      role: 'supporting',
                      setStartsAt: '',
                    }),
                    name: e.target.value,
                  },
                })
              }
            />
            <FieldLabel htmlFor="festa-artist-role">Papel</FieldLabel>
            <select
              id="festa-artist-role"
              value={artistForms[modal.dayId]?.role ?? 'supporting'}
              onChange={(e) =>
                setArtistForms({
                  ...artistForms,
                  [modal.dayId]: {
                    ...(artistForms[modal.dayId] ?? {
                      name: '',
                      setStartsAt: '',
                    }),
                    role: e.target.value,
                  },
                })
              }
            >
              <option value="headliner">Headliner (1 por dia)</option>
              <option value="supporting">Atração de apoio</option>
            </select>
            <FieldLabel htmlFor="festa-artist-set">
              Horário do set (opcional)
            </FieldLabel>
            <input
              id="festa-artist-set"
              type="datetime-local"
              value={artistForms[modal.dayId]?.setStartsAt ?? ''}
              onChange={(e) =>
                setArtistForms({
                  ...artistForms,
                  [modal.dayId]: {
                    ...(artistForms[modal.dayId] ?? {
                      name: '',
                      role: 'supporting',
                    }),
                    setStartsAt: e.target.value,
                  },
                })
              }
            />
            <div className="festa-modal-actions">
              <button
                type="button"
                className="btn-secondary btn"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => addArtist(modal.dayId)}
                disabled={!artistForms[modal.dayId]?.name?.trim()}
              >
                Adicionar
              </button>
            </div>
          </div>
        </FestaModal>
      )}
    </div>
  );
}

function FestaModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="incident-overlay" onClick={onClose} role="presentation">
      <div
        className="incident-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="festa-modal-title"
      >
        <div className="incident-modal-header">
          <div>
            <h4 id="festa-modal-title">{title}</h4>
            {subtitle && (
              <p className="incident-modal-subtitle">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function ArtistRoleSection({
  variant,
  title,
  emptyHint,
  artists,
  onUploadMedia,
  onAddLink,
  onRemoveArtist,
  onRemoveMedia,
}: {
  variant: 'headliner' | 'support';
  title: string;
  emptyHint: string;
  artists: FestivalArtist[];
  onUploadMedia: (artistId: string, file: File) => void;
  onAddLink: (artistId: string) => void;
  onRemoveArtist: (id: string) => void;
  onRemoveMedia: (id: string) => void;
}) {
  const sectionClass =
    variant === 'headliner'
      ? 'artist-section artist-section-headliner'
      : 'artist-section artist-section-support';

  return (
    <section className={sectionClass}>
      <h5 className="artist-section-title">
        {variant === 'headliner' ? '⭐' : '•'} {title}
        {artists.length > 0 && (
          <span
            style={{
              fontWeight: 400,
              fontSize: '0.8rem',
              color: 'var(--muted)',
            }}
          >
            ({artists.length})
          </span>
        )}
      </h5>
      {artists.length === 0 ? (
        <p className="artist-section-empty">{emptyHint}</p>
      ) : (
        artists.map((a) => (
          <ArtistCard
            key={a.id}
            artist={a}
            onUploadMedia={onUploadMedia}
            onAddLink={onAddLink}
            onRemoveArtist={onRemoveArtist}
            onRemoveMedia={onRemoveMedia}
          />
        ))
      )}
    </section>
  );
}

function ArtistCard({
  artist,
  onUploadMedia,
  onAddLink,
  onRemoveArtist,
  onRemoveMedia,
}: {
  artist: FestivalArtist;
  onUploadMedia: (artistId: string, file: File) => void;
  onAddLink: (artistId: string) => void;
  onRemoveArtist: (id: string) => void;
  onRemoveMedia: (id: string) => void;
}) {
  return (
    <article className="artist-card">
      <div className="artist-card-head">
        <span className="artist-card-name">{artist.name}</span>
        {artist.setStartsAt && (
          <span className="artist-card-meta">
            {new Date(artist.setStartsAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
      {(artist.media ?? []).length > 0 && (
        <div className="artist-card-media">
          {(artist.media ?? []).map((m) => (
            <MediaPreview
              key={m.id}
              media={m}
              onDelete={() => onRemoveMedia(m.id)}
            />
          ))}
        </div>
      )}
      <div className="artist-actions">
        <label className="btn-secondary btn btn-sm">
          + Mídia
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadMedia(artist.id, file);
              e.target.value = '';
            }}
          />
        </label>
        <button
          type="button"
          className="btn-secondary btn btn-sm"
          onClick={() => onAddLink(artist.id)}
        >
          + Link
        </button>
        <button
          type="button"
          className="btn-secondary btn btn-sm btn-danger-outline"
          onClick={() => onRemoveArtist(artist.id)}
        >
          Excluir
        </button>
      </div>
    </article>
  );
}

function MediaPreview({
  media,
  onDelete,
}: {
  media: FestivalMedia;
  onDelete: () => void;
}) {
  if (media.type === 'link') {
    return (
      <div style={{ margin: '0.5rem 0' }}>
        <span>
          🔗 {media.caption || media.url}
          <br />
          <small style={{ color: 'var(--muted)' }}>{media.url}</small>
        </span>
        <button
          type="button"
          className="btn-secondary btn"
          style={{ marginLeft: 8, verticalAlign: 'top' }}
          onClick={onDelete}
        >
          Excluir
        </button>
      </div>
    );
  }

  return (
    <div style={{ margin: '0.5rem 0' }}>
      {media.type === 'video' ? (
        <video
          src={mediaSrc(media.url)}
          controls
          style={{ maxWidth: 200, maxHeight: 120 }}
        />
      ) : (
        <img
          src={mediaSrc(media.url)}
          alt=""
          style={{ maxWidth: 200, maxHeight: 120, objectFit: 'cover' }}
        />
      )}
      <button
        type="button"
        className="btn-secondary btn"
        style={{ marginLeft: 8, verticalAlign: 'top' }}
        onClick={onDelete}
      >
        Excluir
      </button>
    </div>
  );
}
