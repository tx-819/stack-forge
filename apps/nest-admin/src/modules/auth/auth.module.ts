import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { MagicLoginStrategy } from './strategies/magic-login.strategy';
import { TokenService } from './services/token.service';
import { WechatService } from './services/wechat.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { CacheModule } from 'src/common/cache/cache.module';
import { EmailModule } from 'src/common/email/email.module';
import { PermissionModule } from '../permission/permission.module';
import { RoleModule } from '../role/role.module';
import { QueueModule } from 'src/common/queue/queue.module';

@Module({
    imports: [
        UserModule,
        PermissionModule,
        RoleModule,
        PassportModule,
        CacheModule,
        EmailModule,
        QueueModule,
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('auth.accessToken.secret'),
                signOptions: {
                    expiresIn: configService.get('auth.accessToken.tokenExp'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        TokenService,
        WechatService,
        LocalStrategy,
        JwtStrategy,
        MagicLoginStrategy,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AuthModule {}
