import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { EmailModule } from '../email/email.module';
import { EMAIL_QUEUE_NAME } from './constants/queue.constant';
import { EmailProcessor } from './processors/email.processor';
import { EmailQueueService } from './services/email-queue.service';

@Module({
    imports: [
        ConfigModule,
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url =
                    config.get<string>('redis.url') || 'redis://localhost:6379';
                return {
                    connection: {
                        url: url,
                    },
                };
            },
        }),
        BullModule.registerQueue({ name: EMAIL_QUEUE_NAME }),
        EmailModule,
    ],
    providers: [EmailProcessor, EmailQueueService],
    exports: [EmailQueueService],
})
export class QueueModule {}
