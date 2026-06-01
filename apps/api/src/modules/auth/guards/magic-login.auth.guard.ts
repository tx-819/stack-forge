import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from 'src/generated/prisma/client';

@Injectable()
export class MagicLoginAuthGuard extends AuthGuard('magic-login') {
    handleRequest<TUser = User>(err: Error | null, user: TUser): TUser {
        if (err || !user) {
            throw err ?? new UnauthorizedException('链接无效或已过期');
        }
        return user;
    }
}
