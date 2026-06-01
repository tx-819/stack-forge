import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services/user.service';
import { TokenService } from './token.service';
import { UserDto } from 'src/modules/user/dtos/user.dto';
import { compare } from 'bcrypt';
import { RoleService } from 'src/modules/role/services/role.service';
import { User } from 'src/generated/prisma/client';
import { MenuTreeDto } from 'src/modules/permission/dtos/menu.dto';
import { PermissionService } from 'src/modules/permission/services/permission.service';
import { uniqBy } from 'lodash';
import {
    ActionListDto,
    RegisterDto,
    SendLoginEmailDto,
    UpdateWechatProfileDto,
} from '../dtos/auth.dto';
import { EmailQueueService } from 'src/common/queue/services/email-queue.service';
import { ConfigService } from '@nestjs/config';
import { renderMagicLoginEmail } from 'src/common/email/templates/magic-login.template';
import { EmailService } from 'src/common/email/services/email.service';
import { ROLE_CODE_USER } from 'src/modules/role/constants/role.constant';
import { WechatService, WechatPhoneInfo } from './wechat.service';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private tokenService: TokenService,
        private roleService: RoleService,
        private permissionService: PermissionService,
        private emailQueueService: EmailQueueService,
        private configService: ConfigService,
        private emailService: EmailService,
        private wechatService: WechatService
    ) {}

    async createToken(userId: number): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        const user = await this.userService.detail(userId);
        const { accessToken, refreshToken } =
            await this.tokenService.generateToken(user);
        return { accessToken, refreshToken };
    }

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.userService.findOne(username);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        // 微信等第三方账号无密码，禁止使用账号密码登录
        if (!user.password) {
            return null;
        }
        if (!(await compare(password, user.password))) {
            return null;
        }
        const { password: _, ...result } = user;
        return result;
    }

    async register(registerDto: RegisterDto): Promise<UserDto> {
        const user = await this.userService.findOne(registerDto.username);
        if (user) {
            throw new BadRequestException('User already exists');
        }
        const defaultRole = await this.roleService.findByCode(ROLE_CODE_USER);
        if (!defaultRole) {
            throw new BadRequestException(
                `Default role "${ROLE_CODE_USER}" not found`
            );
        }
        const { rolesIds: _rolesIds, ...userData } = registerDto;
        await this.userService.create({
            ...userData,
            rolesIds: [defaultRole.id],
        });
        const created = await this.userService.findOne(registerDto.username);
        if (!created) {
            throw new BadRequestException('User creation failed');
        }
        const { password: _password, ...result } = created;
        return result as UserDto;
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        const userId =
            await this.tokenService.getUserIdByRefreshToken(refreshToken);
        if (userId == null) {
            throw new ForbiddenException('Invalid refresh token');
        }
        await this.tokenService.verifyRefreshToken(userId, refreshToken);
        const user = await this.userService.detail(userId);
        const accessToken = await this.tokenService.createAccessToken(user);
        return { accessToken };
    }

    async me(userId: number): Promise<UserDto> {
        return this.userService.detailWithRoles(userId);
    }

    /**
     * 微信小程序登录：code 换 openid -> 查找或创建用户 -> 生成自定义登录态。
     * session_key 用完即弃，不保存、不下发。
     */
    async wechatMiniLogin(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: User;
    }> {
        const { openid, unionid } = await this.wechatService.code2Session(code);

        let user = await this.userService.findByOpenid(openid);
        if (!user) {
            const defaultRole =
                await this.roleService.findByCode(ROLE_CODE_USER);
            if (!defaultRole) {
                throw new BadRequestException(
                    `Default role "${ROLE_CODE_USER}" not found`
                );
            }
            user = await this.userService.createWechatUser({
                openid,
                unionid,
                roleId: defaultRole.id,
            });
        }

        const { accessToken, refreshToken } =
            await this.tokenService.generateToken(user);
        return { accessToken, refreshToken, user };
    }

    /** 更新微信用户资料（头像昵称填写能力） */
    async updateWechatProfile(
        userId: number,
        dto: UpdateWechatProfileDto
    ): Promise<UserDto> {
        const user = await this.userService.updateProfile(userId, dto);
        const { password: _password, ...result } = user;
        return result as UserDto;
    }

    /** 通过 getPhoneNumber 的 code 换取手机号并回填用户 */
    async bindWechatPhone(
        userId: number,
        code: string
    ): Promise<WechatPhoneInfo> {
        const phoneInfo = await this.wechatService.getPhoneNumber(code);
        await this.userService.bindPhone(userId, phoneInfo.purePhoneNumber);
        return phoneInfo;
    }

    /** 微信用户绑定真实邮箱 */
    async bindWechatUserEmail(
        userId: number,
        email: string
    ): Promise<UserDto> {
        const user = await this.userService.bindEmail(userId, email);
        const { password: _password, ...result } = user;
        return result as UserDto;
    }

    async getMenuTreeByUser(user: User): Promise<MenuTreeDto[]> {
        if (user.isSuper) {
            const permissions =
                await this.permissionService.getAllPermissions();
            return this.permissionService.buildMenuTrees(permissions);
        }
        const roles = await this.roleService.getRolesByUser(user);
        if (roles.length === 0) return [];
        const roleIds = roles.map(r => r.id);
        const permissions =
            await this.permissionService.getPermissionsByRoles(roleIds);
        const uniquePermissions = uniqBy(permissions, 'id');
        return this.permissionService.buildMenuTrees(uniquePermissions);
    }

    async getActionsByUser(user: User): Promise<ActionListDto[]> {
        if (user.isSuper) {
            const permissions =
                await this.permissionService.getAllPermissions();
            return this.permissionService.buildActions(permissions);
        }
        const roles = await this.roleService.getRolesByUser(user);
        if (roles.length === 0) return [];
        const roleIds = roles.map(r => r.id);
        const permissions =
            await this.permissionService.getPermissionsByRoles(roleIds);
        const uniquePermissions = uniqBy(permissions, 'id');
        return this.permissionService.buildActions(uniquePermissions);
    }

    async sendLoginEmail(sendLoginEmailDto: SendLoginEmailDto): Promise<void> {
        const { email } = sendLoginEmailDto;
        const user = await this.userService.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.emailService.checkSendRateLimit(email, {
            keyPrefix: 'ratelimit:login-email:',
        });

        const token = await this.tokenService.generateLoginToken(user);
        const magicLoginTtl =
            this.configService.get<number>('auth.magicLoginToken.ttl') ??
            60 * 5;
        const appHost = this.configService.get<string>('app.host');
        const appPort = this.configService.get<number>('app.port');
        await this.emailQueueService.addMail({
            to: email,
            subject: '一键登录',
            html: renderMagicLoginEmail({
                loginUrl: `http://${appHost}:${appPort}/auth/magic-login?token=${token}`,
                expiresInMinutes: Math.floor(magicLoginTtl / 60),
            }),
        });
    }
}
