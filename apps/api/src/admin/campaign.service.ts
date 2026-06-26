import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { deleteCampaignFileByUrl } from './campaign-media.util';

@Injectable()
export class CampaignService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('campaigns') private readonly campaignQueue: Queue,
  ) {}

  list() {
    return this.prisma.campaign.findMany({
      include: {
        segment: true,
        groups: { include: { broadcastTarget: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: {
    title: string;
    body: string;
    linkUrl?: string | null;
    mediaUrl?: string | null;
    mediaType?: string | null;
    segmentId?: string;
    templateName?: string;
    sendToOptIn?: boolean;
    broadcastTargetIds?: string[];
  }) {
    const targetIds = dto.broadcastTargetIds ?? [];
    return this.prisma.campaign.create({
      data: {
        title: dto.title,
        body: dto.body,
        linkUrl: dto.linkUrl?.trim() || null,
        mediaUrl: dto.mediaUrl ?? null,
        mediaType: dto.mediaType ?? null,
        segmentId: dto.segmentId,
        templateName: dto.templateName,
        sendToOptIn: dto.sendToOptIn ?? true,
        status: 'draft',
        groups: targetIds.length
          ? {
              create: targetIds.map((broadcastTargetId) => ({
                broadcastTargetId,
              })),
            }
          : undefined,
      },
      include: {
        groups: { include: { broadcastTarget: true } },
      },
    });
  }

  async setTargets(
    campaignId: string,
    broadcastTargetIds: string[],
    sendToOptIn?: boolean,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) return null;

    await this.prisma.$transaction([
      this.prisma.campaignGroup.deleteMany({ where: { campaignId } }),
      ...(broadcastTargetIds.length
        ? [
            this.prisma.campaignGroup.createMany({
              data: broadcastTargetIds.map((broadcastTargetId) => ({
                campaignId,
                broadcastTargetId,
              })),
            }),
          ]
        : []),
      this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          ...(sendToOptIn !== undefined ? { sendToOptIn } : {}),
        },
      }),
    ]);

    return this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        groups: { include: { broadcastTarget: true } },
      },
    });
  }

  async updateMedia(
    campaignId: string,
    data: { mediaUrl: string | null; mediaType: string | null },
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) return null;

    if (campaign.mediaUrl) {
      await deleteCampaignFileByUrl(campaign.mediaUrl);
    }

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
      },
      include: {
        groups: { include: { broadcastTarget: true } },
      },
    });
  }

  async queueCampaign(campaignId: string) {
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'queued' },
    });
    await this.campaignQueue.add('send-campaign', { campaignId });
    return { queued: true };
  }
}
