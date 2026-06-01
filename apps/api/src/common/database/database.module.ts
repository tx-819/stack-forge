import { Module } from '@nestjs/common';
import { PrismaService } from './services/database.service';

@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class DatabaseModule {}
