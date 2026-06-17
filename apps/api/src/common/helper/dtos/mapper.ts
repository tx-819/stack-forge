import dayjs from 'dayjs';

import { RoleDto } from 'src/modules/role/dtos/role.dto';
import { UserDto, UserWithRolesDto } from 'src/modules/user/dtos/user.dto';
import type { PermissionType } from '@stack-forge/contracts';
import {
    PermissionDto,
    PermissionTreeDto,
} from 'src/modules/permission/dtos/permission.dto';
import { Role, User, Permission } from 'src/generated/prisma/client';

const toDateTimeString = (value: Date): string =>
    dayjs(value).format('YYYY-MM-DD HH:mm:ss');

const toPermissionType = (value: string): PermissionType => {
    if (value === 'menu' || value === 'action') {
        return value as PermissionType;
    }
    throw new Error(`Invalid permissionType: ${value}`);
};

export const toRoleDto = (role: Role): RoleDto => ({
    ...role,
    createdAt: toDateTimeString(role.createdAt),
    updatedAt: toDateTimeString(role.updatedAt),
});

export const toUserDto = (user: User): UserDto => {
    const { password: _password, ...data } = user;
    return {
        ...data,
        createdAt: toDateTimeString(user.createdAt),
        updatedAt: toDateTimeString(user.updatedAt),
    };
};

export const toUserWithRolesDto = (
    user: User & { roles: { role: Role }[] }
): UserWithRolesDto => ({
    ...toUserDto(user),
    roles: user.roles.map(({ role }) => toRoleDto(role)),
});

export const toPermissionDto = (permission: Permission): PermissionDto => ({
    ...permission,
    permissionType: toPermissionType(permission.permissionType),
    createdAt: toDateTimeString(permission.createdAt),
    updatedAt: toDateTimeString(permission.updatedAt),
});

export const toPermissionTreeDto = (
    permission: Permission,
    children: PermissionTreeDto[] | null
): PermissionTreeDto => ({
    ...toPermissionDto(permission),
    children,
});
