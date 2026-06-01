import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
    EmailService,
    SendMailOptions,
} from '../../email/services/email.service';
import { EMAIL_QUEUE_NAME } from '../constants/queue.constant';

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(private readonly emailService: EmailService) {
        super();
    }

    async process(
        job: Job<SendMailOptions, string | null, string>
    ): Promise<string | null> {
        this.logger.debug(`Processing email job ${job.id}`);
        return this.emailService.send(job.data);
    }
}
