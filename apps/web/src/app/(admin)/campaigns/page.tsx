'use client';



import { useCallback, useEffect, useMemo, useState } from 'react';

import { WhatsAppChat, type ChatMessage } from '@/components/WhatsAppChat';

import { api, apiForm } from '@/lib/api';

import { formatCampaignWhatsAppBody } from '@/lib/campaign-message';

import { canManageBroadcasts, useAdminUser } from '@/lib/admin-user';



type BroadcastTargetRef = {

  broadcastTarget: {

    id: string;

    label: string;

    waId: string;

    canSend: boolean;

  };

};



type Campaign = {

  id: string;

  title: string;

  body: string;

  linkUrl: string | null;

  mediaUrl: string | null;

  mediaType: string | null;

  status: string;

  sentCount: number;

  groupSentCount: number;

  sendToOptIn: boolean;

  groups: BroadcastTargetRef[];

};



type WhatsAppGroup = {

  id: string;

  waId: string;

  label: string;

  canSend: boolean;

  isRestricted: boolean;

  participantCount: number | null;

  active: boolean;

};



function mediaPublicUrl(url: string) {
  if (url.startsWith('http')) return url;
  const base =
    typeof window !== 'undefined'
      ? ''
      : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
        'http://127.0.0.1:3001');
  return `${base}${url}`;
}



function campaignPreviewMessages(

  title: string,

  body: string,

  linkUrl?: string | null,

  mediaUrl?: string | null,

  mediaType?: string | null,

): ChatMessage[] {

  const text = formatCampaignWhatsAppBody(title, body, linkUrl);

  const messages: ChatMessage[] = [];

  const at = new Date().toISOString();



  if (mediaUrl && mediaType === 'image') {

    messages.push({

      to: '',

      direction: 'out',

      type: 'image',

      at,

      imageUrl: mediaPublicUrl(mediaUrl),

      caption: title.trim() || undefined,

    });

  } else if (mediaUrl && mediaType === 'video') {

    messages.push({

      to: '',

      direction: 'out',

      type: 'video',

      at,

      videoUrl: mediaPublicUrl(mediaUrl),

      caption: title.trim() || undefined,

    });

  }



  if (text) {

    messages.push({

      to: '',

      direction: 'out',

      type: 'text',

      at,

      body: text,

    });

  }



  return messages;

}



export default function CampaignsPage() {

  const user = useAdminUser();

  const allowed = canManageBroadcasts(user);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [waGroups, setWaGroups] = useState<WhatsAppGroup[]>([]);

  const [groupsLoading, setGroupsLoading] = useState(false);

  const [form, setForm] = useState({ title: '', body: '', linkUrl: '' });

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const [sendToOptIn, setSendToOptIn] = useState(true);

  const [pendingMedia, setPendingMedia] = useState<File | null>(null);

  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);



  const sendableGroups = useMemo(

    () => waGroups.filter((g) => g.active && g.canSend),

    [waGroups],

  );



  const previewMessages = useMemo(() => {

    if (previewCampaign) {

      return campaignPreviewMessages(

        previewCampaign.title,

        previewCampaign.body,

        previewCampaign.linkUrl,

        previewCampaign.mediaUrl,

        previewCampaign.mediaType,

      );

    }

    return campaignPreviewMessages(form.title, form.body, form.linkUrl);

  }, [form.title, form.body, form.linkUrl, previewCampaign]);



  function load() {

    return api<Campaign[]>('/api/admin/campaigns').then(setCampaigns);

  }



  const loadGroups = useCallback(async (sync = false) => {

    setGroupsLoading(true);

    try {

      const res = await api<{ groups: WhatsAppGroup[] }>(

        `/api/admin/whatsapp/groups${sync ? '?sync=true' : ''}`,

      );

      setWaGroups(res.groups);

    } finally {

      setGroupsLoading(false);

    }

  }, []);



  useEffect(() => {

    if (allowed) {

      load().catch(console.error);

      loadGroups(true).catch(console.error);

    }

  }, [allowed, loadGroups]);



  function toggleGroup(id: string) {

    setSelectedGroupIds((prev) =>

      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],

    );

  }



  async function create(e: React.FormEvent) {

    e.preventDefault();

    const created = await api<Campaign>('/api/admin/campaigns', {

      method: 'POST',

      body: JSON.stringify({

        title: form.title,

        body: form.body,

        linkUrl: form.linkUrl.trim() || undefined,

        sendToOptIn,

        broadcastTargetIds: selectedGroupIds,

      }),

    });



    if (pendingMedia) {

      const fd = new FormData();

      fd.append('file', pendingMedia);

      await apiForm(`/api/admin/campaigns/${created.id}/media/upload`, fd);

    }



    setForm({ title: '', body: '', linkUrl: '' });

    setPendingMedia(null);

    setPreviewCampaign(null);

    setSelectedGroupIds([]);

    setSendToOptIn(true);

    load();

  }



  function targetsForCampaign(campaign: Campaign) {
    if (previewCampaign?.id === campaign.id) {
      return {
        broadcastTargetIds: selectedGroupIds,
        sendToOptIn,
      };
    }
    return {
      broadcastTargetIds: campaign.groups.map((g) => g.broadcastTarget.id),
      sendToOptIn: campaign.sendToOptIn,
    };
  }

  async function queue(id: string, campaign: Campaign) {
    const targets = targetsForCampaign(campaign);
    await api(`/api/admin/campaigns/${id}/targets`, {
      method: 'PATCH',
      body: JSON.stringify(targets),
    });
    await api(`/api/admin/campaigns/${id}/queue`, { method: 'POST' });
    load();
  }

  async function updateDraftTargets(campaign: Campaign) {
    const targets = targetsForCampaign(campaign);
    await api(`/api/admin/campaigns/${campaign.id}/targets`, {
      method: 'PATCH',
      body: JSON.stringify(targets),
    });
    load();
  }



  if (!allowed) {

    return (

      <div>

        <h1>Campanhas de aviso</h1>

        <p className="card" style={{ marginTop: '1rem', color: 'var(--muted)' }}>

          Acesso restrito à equipe de comunicação (administrador, mesa Lieu ou

          criativa).

        </p>

      </div>

    );

  }



  return (

    <div>

      <h1>Campanhas de aviso</h1>

      <p className="page-intro">
        Envie para <strong>grupos do WhatsApp</strong> onde o bot está e pode
        postar, e opcionalmente para quem ativou avisos gerais no PV. Alertas de{' '}
        <strong>jogos</strong> usam atléticas escolhidas pelo usuário no bot
        (menu Avisos → Atléticas).
      </p>



      <div className="page-split">

        <form className="card page-split-main campaigns-compose" onSubmit={create}>

          <input

            placeholder="Título"

            value={form.title}

            onChange={(e) => {

              setPreviewCampaign(null);

              setForm({ ...form, title: e.target.value });

            }}

          />

          <textarea

            placeholder="Mensagem"

            value={form.body}

            onChange={(e) => {

              setPreviewCampaign(null);

              setForm({ ...form, body: e.target.value });

            }}

          />

          <input

            placeholder="Link (opcional)"

            value={form.linkUrl}

            onChange={(e) => {

              setPreviewCampaign(null);

              setForm({ ...form, linkUrl: e.target.value });

            }}

            style={{ marginTop: '0.5rem' }}

          />



          <div style={{ marginTop: '1rem' }}>

            <div

              style={{

                display: 'flex',

                alignItems: 'center',

                gap: '0.5rem',

                flexWrap: 'wrap',

              }}

            >

              <strong>Grupos WhatsApp</strong>

              <button

                type="button"

                className="btn-secondary btn"

                disabled={groupsLoading}

                onClick={() => loadGroups(true)}

              >

                {groupsLoading ? 'Sincronizando…' : 'Atualizar grupos'}

              </button>

            </div>

            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.35rem 0' }}>

              Lista grupos em que a instância do bot participa (Evolution) ou demo

              em <code>dev</code>. Só é possível marcar grupos com permissão de

              envio.

            </p>

            {sendableGroups.length === 0 && !groupsLoading && (

              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>

                Nenhum grupo com permissão. Sincronize com o bot conectado ou

                cadastre em broadcast-targets.

              </p>

            )}

            <ul

              style={{

                listStyle: 'none',

                padding: 0,

                margin: '0.5rem 0',

                maxHeight: 200,

                overflowY: 'auto',

              }}

            >

              {sendableGroups.map((g) => (

                <li key={g.id} style={{ marginBottom: '0.35rem' }}>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      cursor: 'pointer',
                    }}
                  >

                    <input

                      type="checkbox"

                      checked={selectedGroupIds.includes(g.id)}

                      onChange={() => toggleGroup(g.id)}

                    />

                    <span>

                      {g.label}

                      {g.participantCount != null && (

                        <span style={{ color: 'var(--muted)' }}>

                          {' '}

                          ({g.participantCount} membros)

                        </span>

                      )}

                    </span>

                  </label>

                </li>

              ))}

            </ul>

            {waGroups.some((g) => g.active && !g.canSend) && (

              <details style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>

                <summary>

                  {waGroups.filter((g) => g.active && !g.canSend).length} grupo(s)

                  sem permissão de envio

                </summary>

                <ul style={{ paddingLeft: '1.2rem' }}>

                  {waGroups

                    .filter((g) => g.active && !g.canSend)

                    .map((g) => (

                      <li key={g.id}>

                        {g.label}

                        {g.isRestricted ? ' — somente admins' : ''}

                      </li>

                    ))}

                </ul>

              </details>

            )}

          </div>



          <label

            style={{

              display: 'flex',

              alignItems: 'flex-start',

              gap: '0.5rem',

              marginTop: '0.75rem',

              cursor: 'pointer',

            }}

          >

            <input

              type="checkbox"

              checked={sendToOptIn}

              onChange={(e) => setSendToOptIn(e.target.checked)}

            />

            <span>Também enviar no PV para quem ativou avisos gerais</span>

          </label>



          <label

            className="btn-secondary btn"

            style={{ display: 'inline-block', marginTop: '0.5rem' }}

          >

            {pendingMedia ? pendingMedia.name : '+ Imagem ou vídeo (opcional)'}

            <input

              type="file"

              accept="image/jpeg,image/png,image/webp,video/mp4"

              hidden

              onChange={(e) => {

                setPreviewCampaign(null);

                setPendingMedia(e.target.files?.[0] ?? null);

                e.target.value = '';

              }}

            />

          </label>

          {pendingMedia && (

            <button

              type="button"

              className="btn-secondary btn"

              style={{ marginLeft: '0.5rem' }}

              onClick={() => setPendingMedia(null)}

            >

              Remover mídia

            </button>

          )}

          <button type="submit" className="btn" style={{ marginTop: '0.75rem' }}>

            Criar rascunho

          </button>

        </form>



        <div className="page-split-side">
          <p className="page-muted-narrow" style={{ marginBottom: '0.5rem' }}>

            Pré-visualização no PV (igual ao simulador). Formatação WhatsApp:{' '}

            <code>*negrito*</code>.

          </p>

          <WhatsAppChat

            messages={previewMessages}

            provider="preview"

            readOnly

            emptyHint="Preencha título e/ou mensagem para ver o aviso."

          />

        </div>

      </div>



      <div className="card" style={{ marginTop: '1.5rem' }}>

        <div className="table-scroll">
        <table>

          <thead>

            <tr>

              <th>Título</th>

              <th>Destinos</th>

              <th>Status</th>

              <th>Enviados</th>

              <th></th>

            </tr>

          </thead>

          <tbody>

            {campaigns.map((c) => (

              <tr key={c.id}>

                <td>{c.title}</td>

                <td>

                  {c.groups.length > 0 && `${c.groups.length} grupo(s)`}

                  {c.groups.length > 0 && c.sendToOptIn && ' + '}

                  {c.sendToOptIn && 'PV opt-in'}

                  {!c.groups.length && !c.sendToOptIn && '—'}

                  {c.mediaType && ' 📎'}

                  {c.linkUrl && ' 🔗'}

                </td>

                <td>{c.status}</td>

                <td>

                  {c.groupSentCount > 0 && `${c.groupSentCount} grp`}

                  {c.groupSentCount > 0 && c.sentCount > 0 && ' · '}

                  {c.sentCount > 0 && `${c.sentCount} PV`}

                  {!c.groupSentCount && !c.sentCount && '—'}

                </td>

                <td>

                  <button

                    type="button"

                    className="btn-secondary btn"

                    onClick={() => {

                      setPreviewCampaign(c);

                      setForm({

                        title: c.title,

                        body: c.body,

                        linkUrl: c.linkUrl ?? '',

                      });

                      setSelectedGroupIds(

                        c.groups.map((g) => g.broadcastTarget.id),

                      );

                      setSendToOptIn(c.sendToOptIn);

                    }}

                  >

                    Ver preview

                  </button>{' '}

                  {c.status === 'draft' && (

                    <>

                      <button

                        type="button"

                        className="btn-secondary btn"

                        onClick={() => updateDraftTargets(c)}

                      >

                        Salvar destinos

                      </button>{' '}

                      <button

                        type="button"

                        className="btn"

                        onClick={() => queue(c.id, c)}

                      >

                        Enviar fila

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

    </div>

  );

}

