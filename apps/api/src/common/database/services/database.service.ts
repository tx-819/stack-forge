import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from 'src/generated/prisma/client';

function parseDatabaseUrl(url: string) {
    const u = new URL(url);
    const database = u.pathname.replace(/^\//, '') || undefined;
    return {
        host: u.hostname,
        port: u.port ? parseInt(u.port, 10) : 3306,
        user: u.username || undefined,
        password: u.password || undefined,
        database: database || undefined,
        connectTimeout: 15000,
        acquireTimeout: 30000,
        connectionLimit: 10,
    };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
    constructor(private readonly configService: ConfigService) {
        const url = configService.get<string>('database.url')!;
        const poolConfig = parseDatabaseUrl(url);
        const adapter = new PrismaMariaDb(poolConfig, {
            onConnectionError: err => {
                console.error(
                    '[PrismaService] Database connection error:',
                    err.message
                );
            },
        });
        super({ adapter });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
