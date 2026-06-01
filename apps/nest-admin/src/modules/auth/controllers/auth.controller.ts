import { AuthService } from '../services/auth.service';
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';
import { LocalAuthGuard } from '../guards/local.auth.guard';
import { MagicLoginAuthGuard } from '../guards/magic-login.auth.guard';
import {
    ActionListDto,
    AuthResponseDto,
    BindEmailDto,
    LoginDto,
    SendLoginEmailDto,
    UpdateWechatProfileDto,
    WechatAuthResponseDto,
    WechatMiniLoginDto,
    WechatPhoneCodeDto,
} from '../dtos/auth.dto';
import { ReqUser } from '../decorators/user-request.decorator';
import type { User } from 'src/generated/prisma/client';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { CreateUserDto, UserDto } from 'src/modules/user/dtos/user.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { MenuTreeDto } from 'src/modules/permission/dtos/menu.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) {}

    private setRefreshTokenCookie(res: Response, refreshToken: string): void {
        const isProduction = process.env.NODE_ENV === 'production';
        const ttl = this.configService.get<number>('auth.refreshToken.ttl');
        if (!ttl) {
            throw new BadRequestException('Refresh token TTL is not set');
        }
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: ttl * 1000,
            path: '/',
        });
    }

    @Post('login')
    @UseGuards(LocalAuthGuard)
    @ApiBody({ type: LoginDto })
    @DocResponse({ serialization: AuthResponseDto, isPublic: true })
    @Public()
    @ApiOperation({ summary: '用户登录' })
    async login(
        @ReqUser() user: User,
        @Res({ passthrough: true }) res: Response
    ) {
        const { accessToken, refreshToken } =
            await this.authService.createToken(user.id);
        this.setRefreshTokenCookie(res, refreshToken);
        return { accessToken, user };
    }

    @Post('wechat/mini-login')
    @Public()
    @ApiOperation({ summary: '微信小程序登录' })
    @DocResponse({ serialization: WechatAuthResponseDto, isPublic: true })
    async wechatMiniLogin(
        @Body() dto: WechatMiniLoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        const { accessToken, refreshToken, user } =
            await this.authService.wechatMiniLogin(dto.code);

        // 小程序原生 wx.request 不管理 Cookie：约定请求头 X-Client 区分客户端
        const supportsCookie = req.headers['x-client'] !== 'miniprogram';
        if (supportsCookie) {
            this.setRefreshTokenCookie(res, refreshToken);
            return { accessToken, user };
        }
        return { accessToken, refreshToken, user };
    }

    @Post('wechat/profile')
    @ApiOperation({ summary: '更新微信用户资料（头像昵称填写能力）' })
    @DocResponse({ serialization: UserDto })
    updateWechatProfile(
        @ReqUser() user: User,
        @Body() dto: UpdateWechatProfileDto
    ) {
        return this.authService.updateWechatProfile(user.id, dto);
    }

    @Post('wechat/phone')
    @ApiOperation({ summary: '获取微信用户手机号' })
    getWechatPhone(@ReqUser() user: User, @Body() dto: WechatPhoneCodeDto) {
        return this.authService.bindWechatPhone(user.id, dto.code);
    }

    @Post('wechat/bind-email')
    @ApiOperation({ summary: '微信用户绑定邮箱' })
    @DocResponse({ serialization: UserDto })
    bindWechatEmail(@ReqUser() user: User, @Body() dto: BindEmailDto) {
        return this.authService.bindWechatUserEmail(user.id, dto.email);
    }

    @Get('/me')
    @ApiOperation({ summary: '获取当前用户' })
    @DocResponse({ serialization: UserDto })
    me(@ReqUser() user: User): Promise<UserDto> {
        return this.authService.me(user.id);
    }

    @Get('menus')
    @ApiOperation({ summary: '获取当前用户拥有的菜单' })
    @DocResponse({ serialization: MenuTreeDto })
    getMenus(@ReqUser() user: User): Promise<MenuTreeDto[]> {
        return this.authService.getMenuTreeByUser(user);
    }

    @Get('actions')
    @ApiOperation({ summary: '获取当前用户拥有的操作' })
    @DocResponse({ serialization: ActionListDto })
    getActions(@ReqUser() user: User): Promise<ActionListDto[]> {
        return this.authService.getActionsByUser(user);
    }

    @Post('register')
    @ApiOperation({ summary: '用户注册' })
    @DocResponse({ serialization: UserDto, isPublic: true })
    @Public()
    register(@Body() registerDto: CreateUserDto): Promise<UserDto> {
        return this.authService.register(registerDto);
    }

    @Post('refreshToken')
    @ApiOperation({ summary: '刷新令牌' })
    @DocResponse({ serialization: AuthResponseDto, isPublic: true })
    @Public()
    async refreshToken(@Req() request: Request) {
        const refreshToken = request.cookies?.refreshToken;
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }
        return this.authService.refreshToken(refreshToken);
    }

    @Post('sendLoginEmail')
    @ApiOperation({ summary: '发送登录邮件' })
    @DocResponse({ isPublic: true })
    @Public()
    async sendLoginEmail(@Body() sendLoginEmailDto: SendLoginEmailDto) {
        return this.authService.sendLoginEmail(sendLoginEmailDto);
    }

    @Get('magic-login')
    @UseGuards(MagicLoginAuthGuard)
    @ApiOperation({ summary: '一键登录' })
    @DocResponse({ serialization: AuthResponseDto, isPublic: true })
    @Public()
    async magicLogin(
        @ReqUser() user: User,
        @Res({ passthrough: true }) res: Response
    ) {
        const { accessToken, refreshToken } =
            await this.authService.createToken(user.id);
        this.setRefreshTokenCookie(res, refreshToken);
        res.redirect(
            `${this.configService.get<string>('app.frontendUrl')}/login-success?accessToken=${accessToken}`
        );
    }
}
