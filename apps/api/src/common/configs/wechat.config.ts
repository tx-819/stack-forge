import { registerAs } from '@nestjs/config';

export default registerAs(
    'wechat',
    (): Record<string, any> => ({
        miniProgram: {
            appId: process.env.WECHAT_MINI_APP_ID || '',
            appSecret: process.env.WECHAT_MINI_APP_SECRET || '',
            // 微信接口服务根地址，抽成配置便于测试 mock
            apiBaseUrl:
                process.env.WECHAT_API_BASE_URL ||
                'https://api.weixin.qq.com',
        },
    })
);
