import { PrismaService } from 'src/common/database/services/database.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission } from 'src/generated/prisma/client';
import {
    CreatePermissionDto,
    PermissionActionGroup,
    PermissionTreeDto,
    UpdatePermissionDto,
    PERMISSION_TYPE_ACTION,
    PERMISSION_TYPE_MENU,
} from '../dtos/permission.dto';
import { Prisma } from 'src/generated/prisma/client';
import { MenuTreeDto } from '../dtos/menu.dto';
import { filter, groupBy, map as mapLodash, sortBy } from 'lodash';

@Injectable()
export class PermissionService {
    constructor(private prisma: PrismaService) {}

    /** 获取权限树（不分页） */
    async getTree(): Promise<PermissionTreeDto[]> {
        const list = await this.prisma.permission.findMany({
            orderBy: [{ orderNo: 'asc' }, { id: 'asc' }],
        });
        return this.buildTree(list, null);
    }

    private buildTree(
        list: Permission[],
        parentId: number | null
    ): PermissionTreeDto[] {
        return list
            .filter(p => p.parentId === parentId)
            .map(item => {
                const children = this.buildTree(list, item.id);
                return {
                    ...item,
                    children: children.length > 0 ? children : null,
                };
            });
    }

    async detail(id: number): Promise<Permission> {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new NotFoundException('Permission not found');
        }
        return permission;
    }

    async getAllPermissions(): Promise<Permission[]> {
        return await this.prisma.permission.findMany();
    }

    async create(createDto: CreatePermissionDto): Promise<void> {
        const data = this.toCreateInput(createDto);
        await this.prisma.permission.create({ data });
    }

    async update(id: number, updateDto: UpdatePermissionDto): Promise<void> {
        await this.detail(id);
        const data = this.toUpdateInput(updateDto);
        await this.prisma.permission.update({
            where: { id },
            data,
        });
    }

    async delete(id: number): Promise<void> {
        await this.detail(id);
        await this.prisma.permission.delete({ where: { id } });
    }

    private toCreateInput(
        dto: CreatePermissionDto
    ): Prisma.PermissionCreateInput {
        const isAction = dto.permissionType === PERMISSION_TYPE_ACTION;
        return {
            name: dto.name,
            code: isAction ? (dto.code ?? null) : null,
            remark: dto.remark ?? undefined,
            status: dto.status ?? true,
            permissionType: dto.permissionType,
            path: dto.path ?? undefined,
            icon: dto.icon ?? undefined,
            component: dto.component ?? undefined,
            orderNo: dto.orderNo ?? 0,
            parent:
                dto.parentId != null
                    ? { connect: { id: dto.parentId } }
                    : undefined,
        };
    }

    private toUpdateInput(
        dto: UpdatePermissionDto
    ): Prisma.PermissionUpdateInput {
        const data: Prisma.PermissionUpdateInput = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.remark !== undefined) data.remark = dto.remark;
        if (dto.status !== undefined) data.status = dto.status;
        if (dto.permissionType !== undefined)
            data.permissionType = dto.permissionType;
        if (dto.path !== undefined) data.path = dto.path;
        if (dto.icon !== undefined) data.icon = dto.icon;
        if (dto.component !== undefined) data.component = dto.component;
        if (dto.orderNo !== undefined) data.orderNo = dto.orderNo;
        if (
            dto.permissionType === PERMISSION_TYPE_ACTION &&
            dto.code !== undefined
        ) {
            data.code = dto.code;
        } else if (dto.permissionType === PERMISSION_TYPE_MENU) {
            data.code = null;
        }
        if (dto.parentId !== undefined) {
            data.parent =
                dto.parentId != null
                    ? { connect: { id: dto.parentId } }
                    : { disconnect: true };
        }
        return data;
    }

    async getPermissionsByRoles(roleIds: number[]): Promise<Permission[]> {
        const list = await this.prisma.rolePermission.findMany({
            where: { roleId: { in: roleIds } },
            include: { permission: true },
        });
        return list.map(item => item.permission);
    }

    buildMenuTrees(permissions: Permission[]): MenuTreeDto[] {
        const menus = sortBy(
            filter(permissions, p => p.permissionType === PERMISSION_TYPE_MENU),
            ['orderNo', 'id']
        );
        const menusByParentId = groupBy(menus, p => p.parentId ?? 'null');
        return this.buildMenuTree('null', menusByParentId);
    }

    /**
     * 将 action 按所属菜单页面的全路径分组；仅启用且有非空 code。
     * 使用当前列表构建 id 映射，以便在角色子集权限下仍能解析祖先 menu 路径。
     */
    buildActions(permissions: Permission[]): PermissionActionGroup[] {
        const byId = new Map<number, Permission>(
            permissions.map(p => [p.id, p])
        );
        const actions = permissions.filter(
            (p): p is Permission & { code: string } =>
                p.permissionType === PERMISSION_TYPE_ACTION &&
                p.status &&
                typeof p.code === 'string' &&
                p.code.length > 0
        );
        const grouped = new Map<
            string,
            Map<string, { code: string; name: string }>
        >();
        for (const action of actions) {
            const pathname = this.menuFullPathForAction(action, byId);
            if (!grouped.has(pathname)) {
                grouped.set(pathname, new Map());
            }
            const { code, name } = action;
            grouped.get(pathname)!.set(code, { code, name });
        }
        return sortBy(
            [...grouped.entries()].map(([pathname, byCode]) => ({
                pathname,
                actions: sortBy([...byCode.values()], a => a.code),
            })),
            ['pathname']
        );
    }

    private menuFullPathForAction(
        action: Permission,
        byId: Map<number, Permission>
    ): string {
        let id: number | null = action.parentId;
        let menuId: number | null = null;
        const seen = new Set<number>();
        while (id != null) {
            if (seen.has(id)) {
                return '/';
            }
            seen.add(id);
            const p = byId.get(id);
            if (!p) break;
            if (p.permissionType === PERMISSION_TYPE_MENU) {
                menuId = p.id;
                break;
            }
            id = p.parentId;
        }
        if (menuId == null) {
            return '/';
        }
        return this.menuFullPath(menuId, byId);
    }

    private menuFullPath(
        menuId: number,
        byId: Map<number, Permission>
    ): string {
        const parts: string[] = [];
        const seen = new Set<number>();
        let id: number | null = menuId;
        while (id != null) {
            if (seen.has(id)) {
                break;
            }
            seen.add(id);
            const p = byId.get(id);
            if (!p) break;
            if (p.permissionType === PERMISSION_TYPE_MENU && p.path?.trim()) {
                parts.unshift(
                    p.path.trim().replace(/^\/+/, '').replace(/\/+$/, '')
                );
            }
            id = p.parentId ?? null;
        }
        const joined = parts.filter(Boolean).join('/');
        return joined ? `/${joined}` : '/';
    }

    private buildMenuTree(
        parentKey: string,
        menusByParentId: Record<string, Permission[]>
    ): MenuTreeDto[] {
        const menus = menusByParentId[parentKey] ?? [];
        return mapLodash(menus, menu => {
            const children = this.buildMenuTree(
                String(menu.id),
                menusByParentId
            );
            return {
                ...menu,
                children: children.length > 0 ? children : null,
            };
        });
    }
}
