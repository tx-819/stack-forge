import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../cache/cache.module';
import { EmailService } from './services/email.service';

@Module({
    imports: [ConfigModule, CacheModule],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
