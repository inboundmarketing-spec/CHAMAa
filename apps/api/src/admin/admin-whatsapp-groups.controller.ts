import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BroadcastAccessGuard } from '../auth/broadcast-access.guard';
import { WhatsappGroupsService } from '../whatsapp/whatsapp-groups.service';

@Controller('api/admin/whatsapp/groups')
@UseGuards(JwtAuthGuard, BroadcastAccessGuard)
export class AdminWhatsappGroupsController {
  constructor(private readonly groups: WhatsappGroupsService) {}

  @Get()
  list(@Query('sync') sync?: string) {
    const doSync = sync === '1' || sync === 'true';
    return this.groups.listGroups(doSync);
  }

  @Post('sync')
  sync() {
    return this.groups.syncFromProvider();
  }
}
