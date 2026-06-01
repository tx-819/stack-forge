import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@localhost',
    // 邮件发送限流（可按场景覆盖）
    rateLimit: {
        maxAttempts: parseInt(process.env.EMAIL_RATE_LIMIT_MAX ?? '1', 10),
        windowSeconds: parseInt(
            process.env.EMAIL_RATE_LIMIT_WINDOW ?? '60',
            10
        ),
    },
}));
