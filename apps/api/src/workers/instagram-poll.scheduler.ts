import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InstagramModerationService } from '../instagram/instagram-moderation.service';

@Injectable()
export class InstagramPollScheduler {
  private readonly logger = new Logger(InstagramPollScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly moderation: InstagramModerationService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async poll() {
    if (!this.config.get('INSTAGRAM_ACCOUNT_ID')) return;
    try {
      const result = await this.moderation.pollInstagram();
      if (result.polled > 0) {
        this.logger.log(`Instagram: ${result.polled} novos itens`);
      }
    } catch (err) {
      this.logger.error('Erro no poll Instagram', err);
    }
  }
}
