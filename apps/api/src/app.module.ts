import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { resolve } from 'path';
import { RawBodyMiddleware } from './middleware/raw-body.middleware';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { BotModule } from './bot/bot.module';
import { AdminModule } from './admin/admin.module';
import { InternalModule } from './internal/internal.module';
import { WorkersModule } from './workers/workers.module';
import { AuthModule } from './auth/auth.module';
import { InstagramModule } from './instagram/instagram.module';
import { DevModule } from './dev/dev.module';
import { PublicModule } from './public/public.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), 'apps/api/.env'),
        resolve(process.cwd(), '.env'),
        resolve(__dirname, '../.env'),
      ],
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: process.env.REDIS_URL 
        ? { url: process.env.REDIS_URL } 
        : { host: 'localhost', port: 6379 },
    }),
    BullModule.registerQueue(
      { name: 'campaigns' },
      { name: 'match-alerts' },
      { name: 'instagram-dispatch' },
    ),
    PrismaModule,
    AuthModule,
    WhatsappModule,
    BotModule,
    AdminModule,
    InternalModule,
    InstagramModule,
    WorkersModule,
    DevModule,
    PublicModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes('webhook/whatsapp', 'webhook/evolution');
  }
}
