import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  const corsFromEnv = process.env.CORS_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsFromEnv?.length ? corsFromEnv : false,
    credentials: true,
  });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  const publicUrl = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
  console.log(
    publicUrl
      ? `CHAMA API rodando em ${publicUrl}`
      : `CHAMA API rodando na porta ${port}`,
  );
}

bootstrap();
