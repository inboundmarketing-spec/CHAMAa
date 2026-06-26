import {
  Body,
  Controller,
  Delete,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FestasAccessGuard } from '../auth/festas-access.guard';
import {
  AdminFestasService,
  FestivalArtistDto,
  FestivalDayDto,
  UpdateFestivalArtistDto,
  UpdateFestivalDayDto,
  UpdateFestivalDto,
} from './admin-festas.service';
import { saveFestasUpload } from './festas-media.util';

@Controller('api/admin/festas')
@UseGuards(JwtAuthGuard, FestasAccessGuard)
export class AdminFestasController {
  constructor(private readonly festas: AdminFestasService) {}

  @Get()
  get() {
    return this.festas.getFestival();
  }

  @Patch()
  updateFestival(@Body() dto: UpdateFestivalDto) {
    return this.festas.updateFestival(dto);
  }

  @Post('days')
  createDay(@Body() dto: FestivalDayDto) {
    return this.festas.createDay(dto);
  }

  @Patch('days/:id')
  updateDay(@Param('id') id: string, @Body() dto: UpdateFestivalDayDto) {
    return this.festas.updateDay(id, dto);
  }

  @Delete('days/:id')
  deleteDay(@Param('id') id: string) {
    return this.festas.deleteDay(id);
  }

  @Post('days/:dayId/artists')
  createArtist(
    @Param('dayId') dayId: string,
    @Body() dto: FestivalArtistDto,
  ) {
    return this.festas.createArtist(dayId, dto);
  }

  @Patch('artists/:id')
  updateArtist(@Param('id') id: string, @Body() dto: UpdateFestivalArtistDto) {
    return this.festas.updateArtist(id, dto);
  }

  @Delete('artists/:id')
  deleteArtist(@Param('id') id: string) {
    return this.festas.deleteArtist(id);
  }

  @Post('media/link')
  addLinkMedia(
    @Body('scope') scope: 'festival' | 'day' | 'artist',
    @Body('targetId') targetId: string,
    @Body('url') url: string,
    @Body('caption') caption?: string,
  ) {
    return this.festas.addMedia({
      scope,
      targetId,
      type: 'link',
      url: url.trim(),
      caption: caption?.trim() || undefined,
    });
  }

  @Post('media/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body('scope') scope: 'festival' | 'day' | 'artist',
    @Body('targetId') targetId: string,
    @Body('caption') caption?: string,
  ) {
    const saved = await saveFestasUpload(file);
    const media = await this.festas.addMedia({
      scope,
      targetId,
      type: saved.type,
      url: saved.url,
      caption,
    });
    return { ...media, publicUrl: saved.publicUrl };
  }

  @Delete('media/:id')
  deleteMedia(@Param('id') id: string) {
    return this.festas.deleteMedia(id);
  }
}
