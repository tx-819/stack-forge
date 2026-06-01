import { PrismaService } from 'src/common/database/services/database.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission, Role, User } from 'src/generated/prisma/client';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import {
    CreateRoleDto,
    UpdateRoleDto,
    RoleDto,
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

    async getRoles(
        query: RoleListQueryDto
    ): Promise<ApiPaginatedDataDto<RoleDto>> {
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

        return await this.helperPaginationService.paginate(this.prisma.role, pagination, {
            where,
        });
    }

    async detail(id: number): Promise<Role> {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        return role;
    }

    async findByCode(code: string): Promise<Role | null> {
        return this.prisma.role.findUnique({
            where: { code },
        });
    }

    async create(createDto: CreateRoleDto): Promise<RoleDto> {
        const role = await this.prisma.role.create({
            data: createDto,
        });
        return role;
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

    async getPermissions(roleId: number): Promise<Permission[]> {
        await this.detail(roleId);
        const list = await this.prisma.rolePermission.findMany({
            where: { roleId },
            include: { permission: true },
        });
        return list.map(item => item.permission);
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
