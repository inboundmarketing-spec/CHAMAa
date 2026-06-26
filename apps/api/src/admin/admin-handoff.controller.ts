import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FullAccessGuard } from '../auth/full-access.guard';
import { HandoffService } from './handoff.service';

class ReplyDto {
  @IsString()
  content!: string;
}

@Controller('api/admin/handoff')
@UseGuards(JwtAuthGuard, FullAccessGuard)
export class AdminHandoffController {
  constructor(private readonly handoff: HandoffService) {}

  @Get()
  list() {
    return this.handoff.listQueue();
  }

  @Get('history')
  history(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.handoff.listHistory({
      q,
      limit: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
    });
  }

  @Get(':waUserId/messages')
  messages(@Param('waUserId') waUserId: string) {
    return this.handoff.getMessages(waUserId);
  }

  @Post(':waUserId/reply')
  reply(
    @Param('waUserId') waUserId: string,
    @Body() dto: ReplyDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.handoff.reply(waUserId, dto.content, req.user.id);
  }

  @Patch(':waUserId/close')
  close(@Param('waUserId') waUserId: string) {
    return this.handoff.close(waUserId);
  }

  @Patch(':waUserId/assign')
  assign(
    @Param('waUserId') waUserId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.handoff.assign(waUserId, req.user.id);
  }
}
