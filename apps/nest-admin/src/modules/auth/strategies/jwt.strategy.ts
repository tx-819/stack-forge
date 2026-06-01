import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/services/user.service';

interface JwtPayload {
    sub: number;
}

/**
 * 用户认证JWT策略
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>(
                'auth.accessToken.secret'
            ) as string,
        });
    }

    /**
     * 通过荷载解析出用户ID，查询用户是否存在并放入 request
     */
    async validate(payload: JwtPayload) {
        try {
            return await this.userService.detail(payload.sub);
        } catch (e) {
            if (e instanceof NotFoundException) {
                throw new UnauthorizedException('User no longer exists');
            }
            throw e;
        }
    }
}
