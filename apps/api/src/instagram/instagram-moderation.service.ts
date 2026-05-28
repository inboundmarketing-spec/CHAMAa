import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BOT_BUTTON_IDS } from '@chama/shared';

@Injectable()
export class InstagramModerationService {
  private readonly logger = new Logger(InstagramModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly config: ConfigService,
    @InjectQueue('instagram-dispatch') private readonly dispatchQueue: Queue,
  ) {}

  async pollInstagram() {
    const accountId = this.config.get('INSTAGRAM_ACCOUNT_ID');
    const token = this.config.get('INSTAGRAM_ACCESS_TOKEN');
    if (!accountId || !token) {
      this.logger.warn('Instagram API não configurada');
      return { polled: 0 };
    }

    const { data } = await axios.get(
      `https://graph.facebook.com/v21.0/${accountId}/media`,
      {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,timestamp',
          access_token: token,
          limit: 10,
        },
      },
    );

    let newCount = 0;
    for (const item of data.data ?? []) {
      const exists = await this.prisma.instagramMediaQueue.findUnique({
        where: { mediaId: item.id },
      });
      if (exists) continue;

      await this.prisma.instagramMediaQueue.create({
        data: {
          mediaId: item.id,
          mediaType: item.media_type ?? 'IMAGE',
          caption: item.caption,
          mediaUrl: item.media_url,
          permalink: item.permalink,
          status: 'pending',
        },
      });
      newCount++;
      await this.notifyModerationGroup(item);
    }

    return { polled: newCount };
  }

  private async notifyModerationGroup(item: {
    id: string;
    caption?: string;
    media_url?: string;
    permalink?: string;
    media_type?: string;
  }) {
    const groupId = this.config.get('MODERATION_GROUP_WA_ID');
    if (!groupId) {
      this.logger.warn('MODERATION_GROUP_WA_ID não configurado');
      return;
    }

    const queueItem = await this.prisma.instagramMediaQueue.findUnique({
      where: { mediaId: item.id },
    });

    const preview =
      `📸 *Novo post Instagram*\n\n` +
      `${item.caption?.slice(0, 200) ?? '(sem legenda)'}\n\n` +
      `${item.permalink ?? ''}\n\n` +
      `ID fila: ${queueItem?.id}`;

    await this.whatsapp.sendText({ to: groupId, body: preview });

    if (item.media_url) {
      await this.whatsapp.sendImage(
        groupId,
        item.media_url,
        'Preview para moderação',
      );
    }

    await this.whatsapp.sendReplyButtons(
      groupId,
      'Aprovar envio para grupos e PV (opt-in)?',
      [
        {
          id: `${BOT_BUTTON_IDS.IG_APPROVE}_${queueItem?.id}`,
          title: '✅ Aprovar',
        },
        {
          id: `${BOT_BUTTON_IDS.IG_REJECT}_${queueItem?.id}`,
          title: '❌ Rejeitar',
        },
      ],
    );
  }

  async handleModerationButton(buttonId: string, moderatorWaId: string) {
    const approvePrefix = `${BOT_BUTTON_IDS.IG_APPROVE}_`;
    const rejectPrefix = `${BOT_BUTTON_IDS.IG_REJECT}_`;

    if (buttonId.startsWith(approvePrefix)) {
      const queueId = buttonId.replace(approvePrefix, '');
      return this.approve(queueId, moderatorWaId);
    }
    if (buttonId.startsWith(rejectPrefix)) {
      const queueId = buttonId.replace(rejectPrefix, '');
      return this.reject(queueId);
    }
  }

  async approve(queueId: string, approvedBy?: string) {
    const item = await this.prisma.instagramMediaQueue.update({
      where: { id: queueId },
      data: { status: 'approved', approvedBy },
    });
    await this.dispatchQueue.add('dispatch-approved', { queueId: item.id });
    return item;
  }

  async reject(queueId: string) {
    return this.prisma.instagramMediaQueue.update({
      where: { id: queueId },
      data: { status: 'rejected' },
    });
  }

  async dispatchApproved(queueId: string) {
    const item = await this.prisma.instagramMediaQueue.findUnique({
      where: { id: queueId },
    });
    if (!item || item.status !== 'approved') return;

    const message =
      `📢 *Interunesp no Instagram*\n\n${item.caption ?? ''}\n${item.permalink ?? ''}`;

    const groups = await this.prisma.broadcastTarget.findMany({
      where: { active: true, type: 'group', canSend: true },
    });
    for (const g of groups) {
      await this.whatsapp.sendText({ to: g.waId, body: message });
      if (item.mediaUrl) {
        await this.whatsapp.sendImage(g.waId, item.mediaUrl);
      }
    }

    const optIns = await this.prisma.notificationOptIn.findMany({
      where: { active: true, segment: 'general' },
      include: { waUser: true },
    });
    for (const opt of optIns) {
      await this.whatsapp.sendText({ to: opt.waUser.waId, body: message });
      if (item.mediaUrl) {
        await this.whatsapp.sendImage(opt.waUser.waId, item.mediaUrl);
      }
    }

    await this.prisma.instagramMediaQueue.update({
      where: { id: queueId },
      data: { status: 'sent', sentAt: new Date() },
    });
  }
}
