import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { Logger } from '@nestjs/common';
import { publicMediaUrl } from '../admin/festas-media.util';

function buildCampaignBody(campaign: {
  title: string;
  body: string;
  linkUrl: string | null;
}) {
  let text = `📢 *${campaign.title}*\n\n${campaign.body}`;
  if (campaign.linkUrl?.trim()) {
    text += `\n\n🔗 ${campaign.linkUrl.trim()}`;
  }
  return text;
}

@Processor('campaigns')
export class CampaignProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
  ) {
    super();
  }

  async process(job: Job<{ campaignId: string }>) {
    if (job.name !== 'send-campaign') return;

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: job.data.campaignId },
      include: {
        segment: true,
        groups: { include: { broadcastTarget: true } },
      },
    });
    if (!campaign) return;

    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'sending' },
    });

    const body = buildCampaignBody(campaign);
    let pvSent = 0;
    let groupSent = 0;

    const sendPayload = async (to: string) => {
      if (campaign.templateName) {
        await this.whatsapp.sendTemplate(to, campaign.templateName);
        return;
      }
      if (campaign.mediaUrl && campaign.mediaType) {
        const mediaUrl = publicMediaUrl(campaign.mediaUrl);
        if (campaign.mediaType === 'video') {
          await this.whatsapp.sendVideo(to, mediaUrl, campaign.title);
        } else if (campaign.mediaType === 'image') {
          await this.whatsapp.sendImage(to, mediaUrl, campaign.title);
        }
      }
      await this.whatsapp.sendText({ to, body });
    };

    for (const link of campaign.groups) {
      const target = link.broadcastTarget;
      if (!target.active || !target.canSend) {
        this.logger.warn(
          `Grupo ignorado (inativo ou sem permissão): ${target.label}`,
        );
        continue;
      }
      try {
        await sendPayload(target.waId);
        groupSent++;
      } catch (err) {
        this.logger.warn(`Campanha falhou no grupo ${target.waId}`, err);
      }
    }

    if (campaign.sendToOptIn) {
      const optIns = await this.prisma.notificationOptIn.findMany({
        where: { active: true, segment: 'general' },
        include: { waUser: true },
      });

      for (const opt of optIns) {
        try {
          await sendPayload(opt.waUser.waId);
          pvSent++;
        } catch (err) {
          this.logger.warn(`Campanha falhou para ${opt.waUser.waId}`, err);
        }
      }
    }

    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'sent',
        sentCount: pvSent,
        groupSentCount: groupSent,
      },
    });
  }
}
