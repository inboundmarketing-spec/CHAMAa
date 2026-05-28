import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import {
  AdminRole,
  canManageAuthorizations,
  grantableAuthorizationRoles,
} from '@chama/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AllowedEmailsService } from '../auth/allowed-emails.service';
import { AdminRequestUser } from '../auth/admin-permissions';

const GRANTABLE = [
  AdminRole.CO_DIRECTOR,
  AdminRole.VENUE_COORDINATOR,
  AdminRole.NEUTRAL,
] as const;

class AddAuthorizationDto {
  @IsEmail()
  email!: string;

  @IsIn(GRANTABLE)
  role!: (typeof GRANTABLE)[number];

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  venueId?: string;
}

@Controller('api/admin/authorizations')
@UseGuards(JwtAuthGuard)
export class AdminAuthorizationsController {
  constructor(private readonly allowedEmails: AllowedEmailsService) {}

  private assertCanManage(user: AdminRequestUser) {
    if (!canManageAuthorizations(user.role)) {
      throw new ForbiddenException('Sem permissão para acessar autorizações');
    }
  }

  @Get()
  async list(@Req() req: { user: AdminRequestUser }) {
    this.assertCanManage(req.user);
    const grantableRoles = grantableAuthorizationRoles(req.user.role);
    const entries = await this.allowedEmails.list();
    return { grantableRoles, entries };
  }

  @Post()
  async add(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: AddAuthorizationDto,
  ) {
    this.assertCanManage(req.user);
    return this.allowedEmails.add(req.user, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    this.assertCanManage(req.user);
    return this.allowedEmails.remove(req.user, id);
  }
}
