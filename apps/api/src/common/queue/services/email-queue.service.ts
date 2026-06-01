import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { SendMailOptions } from '../../email/services/email.service';
import { EMAIL_QUEUE_NAME, EMAIL_JOB_NAME } from '../constants/queue.constant';

@Injectable()
export class EmailQueueService {
    private readonly logger = new Logger(EmailQueueService.name);

    constructor(
        @InjectQueue(EMAIL_QUEUE_NAME)
        private readonly emailQueue: Queue
    ) {}

    /**
     * Add an email to the queue. The email will be sent asynchronously by the worker.
     * @returns Job id
     */
    async addMail(options: SendMailOptions, delayMs?: number): Promise<string> {
        const job = await this.emailQueue.add(EMAIL_JOB_NAME, options, {
            delay: delayMs,
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 5000 },
        });
        this.logger.debug(`Email job added: ${job.id}`);
        return job.id!;
    }
}
