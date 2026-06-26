import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FullAccessGuard } from '../auth/full-access.guard';
import {
  AdminHelpService,
  CreateKnowledgeDto,
  UpdateKnowledgeDto,
} from './admin-help.service';

@Controller('api/admin/help')
@UseGuards(JwtAuthGuard, FullAccessGuard)
export class AdminHelpController {
  constructor(private readonly help: AdminHelpService) {}

  @Get('suggestions')
  listSuggestions() {
    return this.help.listSuggestions();
  }

  @Delete('suggestions/:id')
  deleteSuggestion(@Param('id') id: string) {
    return this.help.deleteSuggestion(id);
  }

  @Get('knowledge')
  listKnowledge() {
    return this.help.listKnowledge();
  }

  @Post('knowledge')
  createKnowledge(@Body() dto: CreateKnowledgeDto) {
    return this.help.createKnowledge(dto);
  }

  @Patch('knowledge/:id')
  updateKnowledge(@Param('id') id: string, @Body() dto: UpdateKnowledgeDto) {
    return this.help.updateKnowledge(id, dto);
  }

  @Delete('knowledge/:id')
  deleteKnowledge(@Param('id') id: string) {
    return this.help.deleteKnowledge(id);
  }
}
