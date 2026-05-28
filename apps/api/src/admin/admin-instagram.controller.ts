import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BroadcastAccessGuard } from '../auth/broadcast-access.guard';
import { PrismaService } from '../prisma/prisma.service';
import { InstagramModerationService } from '../instagram/instagram-moderation.service';

@Controller('api/admin/instagram')
@UseGuards(JwtAuthGuard, BroadcastAccessGuard)
export class AdminInstagramController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: InstagramModerationService,
  ) {}

  @Get('queue')
  queue() {
    return this.prisma.instagramMediaQueue.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Post('queue/:id/approve')
  approve(@Param('id') id: string) {
    return this.moderation.approve(id);
  }

  @Post('queue/:id/reject')
  reject(@Param('id') id: string) {
    return this.moderation.reject(id);
  }

  @Post('poll')
  triggerPoll() {
    return this.moderation.pollInstagram();
  }
}
