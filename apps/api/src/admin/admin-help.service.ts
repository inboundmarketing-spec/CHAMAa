import { Injectable, NotFoundException } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateKnowledgeDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateKnowledgeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@Injectable()
export class AdminHelpService {
  constructor(private readonly prisma: PrismaService) {}

  listSuggestions() {
    return this.prisma.helpFeedback.findMany({
      where: {
        AND: [{ suggestion: { not: null } }, { suggestion: { not: '' } }],
      },
      include: {
        waUser: { select: { waId: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async deleteSuggestion(id: string) {
    const row = await this.prisma.helpFeedback.findUnique({ where: { id } });
    if (!row?.suggestion?.trim()) {
      throw new NotFoundException('Sugestão não encontrada');
    }
    try {
      await this.prisma.helpFeedback.delete({ where: { id } });
      return { deleted: true };
    } catch {
      throw new NotFoundException('Sugestão não encontrada');
    }
  }

  listKnowledge() {
    return this.prisma.knowledgeArticle.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  createKnowledge(dto: CreateKnowledgeDto) {
    return this.prisma.knowledgeArticle.create({
      data: {
        title: dto.title,
        content: dto.content,
        tags: dto.tags ?? '',
        active: dto.active ?? true,
      },
    });
  }

  async updateKnowledge(id: string, dto: UpdateKnowledgeDto) {
    try {
      return await this.prisma.knowledgeArticle.update({
        where: { id },
        data: dto,
      });
    } catch {
      throw new NotFoundException('Artigo não encontrado');
    }
  }

  async deleteKnowledge(id: string) {
    try {
      await this.prisma.knowledgeArticle.delete({ where: { id } });
      return { deleted: true };
    } catch {
      throw new NotFoundException('Artigo não encontrado');
    }
  }
}
