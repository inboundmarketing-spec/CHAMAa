import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    const panel =
      process.env.CORS_ORIGIN?.split(',')[0]?.trim() ??
      'http://localhost:3000';

    return {
      status: 'ok',
      service: 'chama-api',
      panel,
      endpoints: {
        dev: '/api/dev/provider',
        auth: '/api/auth/login',
        webhookWhatsapp: '/webhook/whatsapp',
      },
    };
  }
}
