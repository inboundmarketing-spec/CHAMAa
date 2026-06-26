import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AllowedEmailsService } from './allowed-emails.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly allowedEmails: AllowedEmailsService,
  ) {}

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.adminUser.findUnique({
      where: { email: normalized },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException(
        'Conta sem senha. Use Primeiro acesso para criar sua senha.',
      );
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        venueId: user.venueId,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.adminUser.findUnique({ where: { id: userId } });
  }

  async checkFirstAccess(email: string) {
    const normalized = email.trim().toLowerCase();
    const allowed = await this.allowedEmails.findByEmail(normalized);
    if (!allowed) {
      throw new ForbiddenException('E-mail não autorizado para primeiro acesso');
    }

    const existing = await this.prisma.adminUser.findUnique({
      where: { email: normalized },
    });

    if (existing?.passwordHash) {
      throw new ConflictException(
        'Este e-mail já possui senha cadastrada. Use Entrar.',
      );
    }

    return {
      ok: true as const,
      email: normalized,
      name: existing?.name ?? allowed.name,
      role: allowed.role,
    };
  }

  async setupFirstAccess(email: string, password: string, name?: string) {
    const normalized = email.trim().toLowerCase();
    const allowed = await this.allowedEmails.findByEmail(normalized);
    if (!allowed) {
      throw new ForbiddenException('E-mail não autorizado para primeiro acesso');
    }

    const existing = await this.prisma.adminUser.findUnique({
      where: { email: normalized },
    });

    if (existing?.passwordHash) {
      throw new ConflictException(
        'Este e-mail já possui senha cadastrada. Use Entrar.',
      );
    }

    const displayName = (name?.trim() || existing?.name || allowed.name).slice(
      0,
      120,
    );
    if (!displayName) {
      throw new BadRequestException('Informe seu nome');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = existing
      ? await this.prisma.adminUser.update({
          where: { id: existing.id },
          data: { passwordHash, name: displayName },
        })
      : await this.prisma.adminUser.create({
          data: {
            email: normalized,
            passwordHash,
            name: displayName,
            role: allowed.role,
            venueId: allowed.venueId ?? null,
          },
        });

    return this.issueToken(user);
  }

  private issueToken(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    venueId: string | null;
  }) {
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        venueId: user.venueId,
      },
    };
  }
}
