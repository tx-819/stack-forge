import { registerAs } from '@nestjs/config';
import { parseCorsOrigins } from './parse-cors-origins';
import { APP_ENVIRONMENT } from 'src/app/enums/app.enum';

export default registerAs('app', () => ({
    env: process.env.NODE_ENV || APP_ENVIRONMENT.DEVELOPMENT,
    port: process.env.APP_PORT || 3000,
    host: process.env.APP_HOST || 'localhost',
    name: process.env.APP_NAME || 'app',
    version: process.env.APP_VERSION || '1.0.0',
    logLevel: process.env.APP_LOG_LEVEL || 'info',
    frontendUrl: process.env.APP_FRONTEND_URL || 'http://localhost:3000',
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
}));
