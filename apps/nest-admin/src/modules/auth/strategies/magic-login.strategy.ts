import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import type { Request } from 'express';
import { User } from 'src/generated/prisma/client';
import { TokenService } from '../services/token.service';
import { UserService } from 'src/modules/user/services/user.service';

const MAGIC_LOGIN_STRATEGY_NAME = 'magic-login';

@Injectable()
export class MagicLoginStrategy extends PassportStrategy(
    Strategy,
    MAGIC_LOGIN_STRATEGY_NAME
) {
    constructor(
        private readonly tokenService: TokenService,
        private readonly userService: UserService
    ) {
        super();
    }

    async validate(req: Request): Promise<User> {
        const token =
            typeof req.query?.token === 'string' ? req.query.token : null;
        if (!token) {
            throw new UnauthorizedException('无效的登录链接');
        }
        const userId = await this.tokenService.consumeMagicLoginToken(token);
        if (userId == null) {
            throw new UnauthorizedException(
                '链接无效或已过期，请重新获取登录邮件'
            );
        }
        const user = await this.userService.detail(userId);
        if (!user) {
            throw new UnauthorizedException('用户不存在');
        }
        return user;
    }
}
