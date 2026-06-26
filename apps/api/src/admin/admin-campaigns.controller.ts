import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BroadcastAccessGuard } from '../auth/broadcast-access.guard';
import { CampaignService } from './campaign.service';
import { saveCampaignUpload } from './campaign-media.util';

class CreateCampaignDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  segmentId?: string;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsBoolean()
  sendToOptIn?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  broadcastTargetIds?: string[];
}

class UpdateCampaignTargetsDto {
  @IsArray()
  @IsString({ each: true })
  broadcastTargetIds!: string[];

  @IsOptional()
  @IsBoolean()
  sendToOptIn?: boolean;
}

@Controller('api/admin/campaigns')
@UseGuards(JwtAuthGuard, BroadcastAccessGuard)
export class AdminCampaignsController {
  constructor(private readonly campaigns: CampaignService) {}

  @Get()
  list() {
    return this.campaigns.list();
  }

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaigns.create(dto);
  }

  @Patch(':id/targets')
  updateTargets(@Param('id') id: string, @Body() dto: UpdateCampaignTargetsDto) {
    return this.campaigns.setTargets(
      id,
      dto.broadcastTargetIds,
      dto.sendToOptIn,
    );
  }

  @Post(':id/queue')
  queue(@Param('id') id: string) {
    return this.campaigns.queueCampaign(id);
  }

  @Post(':id/media/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadMedia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const saved = await saveCampaignUpload(file);
    const campaign = await this.campaigns.updateMedia(id, {
      mediaUrl: saved.url,
      mediaType: saved.type,
    });
    return { ...campaign, publicUrl: saved.publicUrl };
  }
}
