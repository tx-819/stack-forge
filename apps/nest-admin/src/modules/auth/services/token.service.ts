import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { User } from 'src/generated/prisma/client';
import { CacheService } from 'src/common/cache/services/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private cacheService: CacheService,
        private configService: ConfigService
    ) {}

    async generateToken(user: User) {
        const accessToken = await this.createAccessToken(user);
        const refreshToken = await this.createRefreshToken(user);
        return {
            accessToken,
            refreshToken,
        };
    }

    async generateLoginToken(user: User) {
        const token = randomBytes(32).toString('base64url');
        const ttl = this.configService.get<number>('auth.magicLoginToken.ttl');
        await this.cacheService.set(`magic_login_token:${token}`, user.id, ttl);
        return token;
    }

    /**
     * 校验并消费魔法链接 token（一次性），返回 userId，无效或已使用返回 null
     */
    async consumeMagicLoginToken(token: string): Promise<number | null> {
        const key = `magic_login_token:${token}`;
        const userId = await this.cacheService.get<number>(key);
        if (userId == null) return null;
        await this.cacheService.del(key);
        return typeof userId === 'number' ? userId : parseInt(String(userId), 10) || null;
    }

    async createAccessToken(user: User) {
        return this.jwtService.sign({
            sub: user.id,
        });
    }

    async verifyRefreshToken(userId: number, refreshToken: string) {
        const tokenHash = createHash('sha256')
            .update(refreshToken)
            .digest('hex');
        const cachedTokenHash = await this.cacheService.get<string>(
            `refresh_token:${userId}`
        );
        if (!cachedTokenHash) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        if (cachedTokenHash !== tokenHash) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async createRefreshToken(user: User) {
        const oldTokenHash = await this.cacheService.get<string>(
            `refresh_token:${user.id}`
        );
        if (oldTokenHash) {
            await this.cacheService.del(`refresh_token_lookup:${oldTokenHash}`);
        }
        const refreshToken = randomBytes(32).toString('base64url');
        const ttl = this.configService.get<number>('auth.refreshToken.ttl');
        const tokenHash = createHash('sha256')
            .update(refreshToken)
            .digest('hex');
        await Promise.all([
            this.cacheService.set(`refresh_token:${user.id}`, tokenHash, ttl),
            this.cacheService.set(
                `refresh_token_lookup:${tokenHash}`,
                String(user.id),
                ttl
            ),
        ]);
        return refreshToken;
    }

    /** 通过 refreshToken 查出 userId，用于刷新接口未带 JWT 时 */
    async getUserIdByRefreshToken(
        refreshToken: string
    ): Promise<number | null> {
        const tokenHash = createHash('sha256')
            .update(refreshToken)
            .digest('hex');
        const userIdStr = await this.cacheService.get<string>(
            `refresh_token_lookup:${tokenHash}`
        );
        if (!userIdStr) return null;
        const userId = parseInt(userIdStr, 10);
        return Number.isNaN(userId) ? null : userId;
    }
}
