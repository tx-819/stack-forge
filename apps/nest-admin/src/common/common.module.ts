import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configs from './configs';
import { CustomLoggerModule } from './logger/logger.module';
import { ResponseModule } from './response/response.module';
import { DatabaseModule } from './database/database.module';
import { RequestModule } from './request/request.module';
import { CacheModule } from './cache/cache.module';
import { EmailModule } from './email/email.module';
import { QueueModule } from './queue/queue.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: configs,
            envFilePath: '.env',
            cache: true,
        }),
        CustomLoggerModule,
        ResponseModule,
        RequestModule,
        CacheModule,
        DatabaseModule,
        EmailModule,
        QueueModule,
    ],
    exports: [DatabaseModule, EmailModule, QueueModule],
})
export class CommonModule {}
