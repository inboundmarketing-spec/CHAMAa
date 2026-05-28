import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { FullAccessGuard } from './full-access.guard';
import { BroadcastAccessGuard } from './broadcast-access.guard';
import { FestasAccessGuard } from './festas-access.guard';
import { AllowedEmailsService } from './allowed-emails.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret-change-me'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    FullAccessGuard,
    BroadcastAccessGuard,
    FestasAccessGuard,
    AllowedEmailsService,
  ],
  exports: [
    AuthService,
    JwtModule,
    FullAccessGuard,
    BroadcastAccessGuard,
    FestasAccessGuard,
    AllowedEmailsService,
  ],
})
export class AuthModule {}
