import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MatchAlertService, MatchUpdatedJob } from '../internal/match-alert.service';

@Processor('match-alerts')
export class MatchAlertProcessor extends WorkerHost {
  constructor(private readonly alerts: MatchAlertService) {
    super();
  }

  async process(job: Job<MatchUpdatedJob>) {
    if (job.name === 'match-updated') {
      await this.alerts.processUpdate(job.data);
    }
  }
}
