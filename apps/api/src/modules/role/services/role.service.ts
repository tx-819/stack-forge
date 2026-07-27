import { PrismaService } from 'src/common/database/services/database.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from 'src/generated/prisma/client';
import {
    CreateRoleDto,
    UpdateRoleDto,
    RoleListQueryDto,
    SetRolePermissionsDto,
} from '../dtos/role.dto';
import { HelperPaginationService } from 'src/common/helper/services/helper.pagination.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class RoleService {
    constructor(
        private prisma: PrismaService,
        private helperPaginationService: HelperPaginationService
    ) {}

    async getRoles(query: RoleListQueryDto) {
        const { name, code, ...pagination } = query;
        const where: Prisma.RoleWhereInput = {
            ...(name
                ? {
                      name: {
                          contains: name,
                      },
                  }
                : {}),
            ...(code
                ? {
                      code: {
                          contains: code,
                      },
                  }
                : {}),
        };

        const result = await this.helperPaginationService.paginate<Role>(
            this.prisma.role,
            pagination,
            {
                where,
            }
        );
        return {
            ...result,
            list: result.list,
        };
    }

    async detail(id: number): Promise<Role> {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new NotFoundException('角色不存在');
        }
        return role;
    }

    async findByCode(code: string): Promise<Role | null> {
        return this.prisma.role.findUnique({
            where: { code },
        });
    }

    async create(createDto: CreateRoleDto) {
        await this.prisma.role.create({
            data: createDto,
        });
    }

    async update(id: number, updateDto: UpdateRoleDto): Promise<void> {
        await this.prisma.role.update({
            where: { id },
            data: updateDto,
        });
    }

    async delete(id: number): Promise<void> {
        await this.detail(id);
        await this.prisma.role.delete({ where: { id } });
    }

    async getPermissions(roleId: number) {
        await this.detail(roleId);
        const list = await this.prisma.rolePermission.findMany({
            where: { roleId },
            include: { permission: true },
        });
        return list;
    }

    async setPermissions(
        roleId: number,
        dto: SetRolePermissionsDto
    ): Promise<void> {
        await this.detail(roleId);
        await this.prisma.rolePermission.deleteMany({ where: { roleId } });
        if (dto.permissionIds.length > 0) {
            await this.prisma.rolePermission.createMany({
                data: dto.permissionIds.map(permissionId => ({
                    roleId,
                    permissionId,
                })),
            });
        }
    }

    async getRolesByUser(user: User): Promise<Role[]> {
        const roles = await this.prisma.userRole.findMany({
            where: { userId: user.id },
            include: { role: true },
        });
        return roles.map(r => r.role);
    }
}
