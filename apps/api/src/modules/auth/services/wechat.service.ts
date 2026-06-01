import {
    BadRequestException,
    Injectable,
    Logger,
    OnModuleInit,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from 'src/common/cache/services/cache.service';

interface Code2SessionApiResponse {
    openid?: string;
    session_key?: string;
    unionid?: string;
    errcode?: number;
    errmsg?: string;
}

interface AccessTokenApiResponse {
    access_token?: string;
    expires_in?: number;
    errcode?: number;
    errmsg?: string;
}

interface GetPhoneNumberApiResponse {
    errcode?: number;
    errmsg?: string;
    phone_info?: {
        phoneNumber: string;
        purePhoneNumber: string;
        countryCode: string;
        watermark?: { appid: string; timestamp: number };
    };
}

export interface Code2SessionResult {
    openid: string;
    /** 仅本次流程使用，不落库、不下发 */
    sessionKey: string;
    unionid?: string;
}

export interface WechatPhoneInfo {
    phoneNumber: string;
    purePhoneNumber: string;
    countryCode: string;
}

const ACCESS_TOKEN_CACHE_KEY = 'wx:access_token';

@Injectable()
export class WechatService implements OnModuleInit {
    private readonly logger = new Logger(WechatService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly cacheService: CacheService
    ) {}

    onModuleInit(): void {
        if (!this.appId || !this.appSecret) {
            this.logger.warn(
                '微信小程序 appId / appSecret 未配置，微信登录相关接口将不可用'
            );
        }
    }

    private get appId(): string {
        return (
            this.configService.get<string>('wechat.miniProgram.appId') ?? ''
        );
    }

    private get appSecret(): string {
        return (
            this.configService.get<string>('wechat.miniProgram.appSecret') ??
            ''
        );
    }

    private get apiBaseUrl(): string {
        return (
            this.configService.get<string>('wechat.miniProgram.apiBaseUrl') ??
            'https://api.weixin.qq.com'
        );
    }

    private ensureConfigured(): void {
        if (!this.appId || !this.appSecret) {
            throw new ServiceUnavailableException('微信小程序未正确配置');
        }
    }

    /**
     * 通过 wx.login 的 code 换取 openid / session_key / unionid。
     * session_key 仅本次流程使用，不会被持久化或下发。
     */
    async code2Session(code: string): Promise<Code2SessionResult> {
        this.ensureConfigured();
        const url = new URL('/sns/jscode2session', this.apiBaseUrl);
        url.searchParams.set('appid', this.appId);
        url.searchParams.set('secret', this.appSecret);
        url.searchParams.set('js_code', code);
        url.searchParams.set('grant_type', 'authorization_code');

        const data = await this.request<Code2SessionApiResponse>(
            url.toString()
        );

        if (data.errcode && data.errcode !== 0) {
            this.handleCode2SessionError(data.errcode, data.errmsg);
        }
        if (!data.openid || !data.session_key) {
            throw new UnauthorizedException('微信登录失败，请重试');
        }

        return {
            openid: data.openid,
            sessionKey: data.session_key,
            unionid: data.unionid,
        };
    }

    /**
     * 获取接口调用凭证 access_token，并缓存到 Redis。
     * 使用 stable_token 接口，避免并发刷新互相顶掉。
     */
    async getAccessToken(): Promise<string> {
        this.ensureConfigured();
        const cached = await this.cacheService.get<string>(
            ACCESS_TOKEN_CACHE_KEY
        );
        if (cached) {
            return cached;
        }

        const url = new URL('/cgi-bin/stable_token', this.apiBaseUrl);
        const data = await this.request<AccessTokenApiResponse>(
            url.toString(),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'client_credential',
                    appid: this.appId,
                    secret: this.appSecret,
                }),
            }
        );

        if (data.errcode && data.errcode !== 0) {
            throw new ServiceUnavailableException(
                `获取微信 access_token 失败：${data.errmsg ?? data.errcode}`
            );
        }
        if (!data.access_token) {
            throw new ServiceUnavailableException('获取微信 access_token 失败');
        }

        const ttl = Math.max((data.expires_in ?? 7200) - 300, 60);
        await this.cacheService.set(
            ACCESS_TOKEN_CACHE_KEY,
            data.access_token,
            ttl
        );
        return data.access_token;
    }

    /**
     * 使用 getPhoneNumber 按钮返回的动态令牌 code 换取手机号。
     */
    async getPhoneNumber(code: string): Promise<WechatPhoneInfo> {
        const accessToken = await this.getAccessToken();
        const url = new URL('/wxa/business/getuserphonenumber', this.apiBaseUrl);
        url.searchParams.set('access_token', accessToken);

        const data = await this.request<GetPhoneNumberApiResponse>(
            url.toString(),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            }
        );

        if (data.errcode && data.errcode !== 0) {
            throw new BadRequestException(
                `获取微信手机号失败：${data.errmsg ?? data.errcode}`
            );
        }
        if (!data.phone_info) {
            throw new BadRequestException('获取微信手机号失败');
        }

        return {
            phoneNumber: data.phone_info.phoneNumber,
            purePhoneNumber: data.phone_info.purePhoneNumber,
            countryCode: data.phone_info.countryCode,
        };
    }

    private async request<T>(url: string, init?: RequestInit): Promise<T> {
        try {
            const response = await fetch(url, init);
            if (!response.ok) {
                throw new ServiceUnavailableException(
                    `微信接口请求失败，状态码：${response.status}`
                );
            }
            return (await response.json()) as T;
        } catch (error) {
            if (error instanceof ServiceUnavailableException) {
                throw error;
            }
            this.logger.error('调用微信接口异常', error as Error);
            throw new ServiceUnavailableException('微信接口暂时不可用，请稍后重试');
        }
    }

    private handleCode2SessionError(errcode: number, errmsg?: string): never {
        switch (errcode) {
            case 40029:
                throw new UnauthorizedException('登录凭证无效，请重新登录');
            case 45011:
                throw new BadRequestException('操作过于频繁，请稍后再试');
            case 40226:
                throw new UnauthorizedException('高风险用户，登录被拦截');
            case -1:
                throw new ServiceUnavailableException(
                    '微信系统繁忙，请稍后重试'
                );
            default:
                throw new UnauthorizedException(
                    `微信登录失败：${errmsg ?? errcode}`
                );
        }
    }
}
