import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { APP_ENVIRONMENT } from './app/enums/app.enum';
import setupSwagger from './swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    // Disable Nest's built-in logger: bufferLogs + useLogger(pino) would still
    // flush InstanceLoader / RoutesResolver INFO and drown concurrently output.
    // App / HTTP logs still go through nestjs-pino (injected Logger + pinoHttp).
    const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
        logger: false,
    });
    const config = app.get(ConfigService);
    const logger = app.get(Logger);
    const env = config.get('app.env');
    const port = config.get('app.port');
    const host = config.get('app.host');
    app.use(cookieParser());

    if (env !== APP_ENVIRONMENT.PRODUCTION) {
        setupSwagger(app);
    }

    await app.listen(port, host);
    logger.log(`Server running on: http://${host}:${port}`);
}

void bootstrap();
