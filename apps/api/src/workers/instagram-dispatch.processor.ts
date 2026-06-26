import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InstagramModerationService } from '../instagram/instagram-moderation.service';

@Processor('instagram-dispatch')
export class InstagramDispatchProcessor extends WorkerHost {
  constructor(private readonly moderation: InstagramModerationService) {
    super();
  }

  async process(job: Job<{ queueId: string }>) {
    if (job.name === 'dispatch-approved') {
      await this.moderation.dispatchApproved(job.data.queueId);
    }
  }
}
