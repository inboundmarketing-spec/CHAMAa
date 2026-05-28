import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  const corsFromEnv = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
  app.enableCors({
    origin:
      corsFromEnv ??
      (process.env.NODE_ENV === 'production'
        ? ['http://localhost:3000']
        : [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            /^http:\/\/localhost:\d+$/,
            /^http:\/\/127\.0\.0\.1:\d+$/,
          ]),
    credentials: true,
  });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`CHAMA API rodando em http://localhost:${port}`);
}

bootstrap();
