import { PrismaService } from 'src/common/database/services/database.service';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { User, Role } from 'src/generated/prisma/client';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import {
    CreateUserDto,
    UpdateUserDto,
    UserWithRolesDto,
} from '../dtos/user.dto';
import { HelperPaginationService } from 'src/common/helper/services/helper.pagination.service';
import { Prisma } from 'src/generated/prisma/client';
import { UserListQueryDto } from '../dtos/user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private helperPaginationService: HelperPaginationService
    ) {}

    async getUsers(
        query: UserListQueryDto
    ): Promise<ApiPaginatedDataDto<UserWithRolesDto>> {
        const { username, nickname, ...pagination } = query;
        const where: Prisma.UserWhereInput = {
            ...(username
                ? {
                      username: {
                          contains: username,
                      },
                  }
                : {}),
            ...(nickname
                ? {
                      nickname: {
                          contains: nickname,
                      },
                  }
                : {}),
        };

        const result = await this.helperPaginationService.paginate<
            User & { roles: { role: Role }[] }
        >(this.prisma.user, pagination, {
            include: {
                roles: { include: { role: true } },
            },
            where,
        });
        console.log('result===', result);
        return {
            ...result,
            list: result.list.map(({ roles, ...user }) => ({
                ...user,
                roles: roles.map(r => r.role),
            })),
        };
    }

    async detail(id: number): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async findOne(username: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByOpenid(openid: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { openid },
        });
    }

    /**
     * 创建微信小程序用户（首次登录自动注册）。
     * 微信用户初始无密码、无邮箱，使用占位 username 满足唯一非空约束。
     */
    async createWechatUser(params: {
        openid: string;
        unionid?: string;
        roleId: number;
    }): Promise<User> {
        const { openid, unionid, roleId } = params;
        return this.prisma.user.create({
            data: {
                username: `wx_${openid}`,
                openid,
                unionid: unionid ?? null,
                roles: {
                    create: [{ role: { connect: { id: roleId } } }],
                },
            },
        });
    }

    async bindEmail(id: number, email: string): Promise<User> {
        const existing = await this.findOneByEmail(email);
        if (existing && existing.id !== id) {
            throw new BadRequestException('该邮箱已被其他账号绑定');
        }
        return this.prisma.user.update({
            where: { id },
            data: { email },
        });
    }

    /** 更新用户资料（头像昵称填写能力收集后按普通字段提交） */
    async updateProfile(
        id: number,
        data: { nickname?: string; avatar?: string }
    ): Promise<User> {
        await this.detail(id);
        return this.prisma.user.update({
            where: { id },
            data: {
                ...(data.nickname !== undefined
                    ? { nickname: data.nickname }
                    : {}),
                ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
            },
        });
    }

    async bindPhone(id: number, phone: string): Promise<User> {
        await this.detail(id);
        return this.prisma.user.update({
            where: { id },
            data: { phone },
        });
    }

    async create(createDto: CreateUserDto): Promise<void> {
        const { rolesIds, ...data } = createDto;
        const hashedPassword = await hash(data.password ?? '123456', 12);
        const dataToCreate: Prisma.UserCreateInput = {
            ...data,
            password: hashedPassword,
            ...(rolesIds?.length
                ? {
                      roles: {
                          create: rolesIds.map(roleId => ({
                              role: { connect: { id: roleId } },
                          })),
                      },
                  }
                : {}),
        };
        await this.prisma.user.create({ data: dataToCreate });
    }

    async update(id: number, updateDto: UpdateUserDto): Promise<void> {
        const { roleIds, ...data } = updateDto;
        const dataToUpdate: Prisma.UserUpdateInput = { ...data };
        if (roleIds !== undefined) {
            dataToUpdate.roles = {
                deleteMany: {},
                ...(roleIds.length > 0
                    ? {
                          create: roleIds.map(roleId => ({
                              role: { connect: { id: roleId } },
                          })),
                      }
                    : {}),
            };
        }
        await this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });
    }

    async delete(id: number): Promise<void> {
        await this.detail(id);
        await this.prisma.user.delete({ where: { id } });
    }

    async detailWithRoles(id: number): Promise<UserWithRolesDto> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { roles: { include: { role: true } } },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return {
            ...user,
            roles: user.roles.map(r => r.role),
        };
    }
}
