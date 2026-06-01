import { registerAs } from '@nestjs/config';

export default registerAs(
    'auth',
    (): Record<string, any> => ({
        accessToken: {
            secret: process.env.AUTH_ACCESS_TOKEN_SECRET || 'secret',
            tokenExp: process.env.AUTH_ACCESS_TOKEN_EXP || '1h',
        },
        refreshToken: {
            ttl: process.env.AUTH_REFRESH_TOKEN_TTL || 60 * 60 * 24 * 7, // 过期时间7天
        },
        magicLoginToken: {
            ttl: process.env.AUTH_MAGIC_LOGIN_TOKEN_TTL || 60 * 5, // 过期时间5分钟
        },
    })
);
