import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsNotEmpty,
    ValidateIf,
} from 'class-validator';
import { BaseDto } from 'src/common/helper/dtos';
import { PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    PERMISSION_TYPE_ACTION,
    PERMISSION_TYPE_MENU,
    PERMISSION_TYPES,
    type AuthAction,
    type CreatePermissionRequest,
    type Permission as ContractPermission,
    type PermissionTree,
    type PermissionType,
    type UpdatePermissionRequest,
} from '@stack-forge/contracts';

export { PERMISSION_TYPE_ACTION, PERMISSION_TYPE_MENU, PERMISSION_TYPES };

/** 按路由分组的操作权限（供 Permission 层返回，字段与 Auth 侧 ActionListDto 对齐） */
export type PermissionActionGroup = AuthAction;

export class PermissionDto extends BaseDto implements ContractPermission {
    @ApiProperty({ example: '用户管理' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'user:list', required: false, nullable: true })
    @IsString()
    @IsOptional()
    code: string | null;

    @ApiProperty({ example: '', required: false, nullable: true })
    @IsString()
    @IsOptional()
    remark: string | null;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    status: boolean;

    @ApiProperty({ example: 'menu', enum: PERMISSION_TYPES })
    @IsString()
    @IsIn(PERMISSION_TYPES)
    permissionType: PermissionType;

    @ApiProperty({ example: '/user', required: false, nullable: true })
    @IsString()
    @IsOptional()
    path: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    icon: string | null;

    @ApiProperty({ example: '', required: false, nullable: true })
    @IsString()
    @IsOptional()
    component: string | null;

    @ApiProperty({ example: 0 })
    @IsInt()
    @IsOptional()
    orderNo: number;

    @ApiProperty({ example: 0, required: false, nullable: true })
    @IsInt()
    @IsOptional()
    parentId: number | null;
}

export class PermissionTreeDto extends PermissionDto implements PermissionTree {
    @ApiProperty({ type: [() => PermissionTreeDto], nullable: true })
    @Type(() => PermissionTreeDto)
    children: PermissionTreeDto[] | null;
}

export class CreatePermissionDto extends PickType(PermissionDto, [
    'name',
    'remark',
    'status',
    'permissionType',
    'path',
    'icon',
    'component',
    'orderNo',
    'parentId',
]) implements CreatePermissionRequest {
    @ApiProperty({
        example: 'user:list',
        description: 'action 权限时必传，表示权限码',
        required: false,
    })
    @ValidateIf(o => o.permissionType === PERMISSION_TYPE_ACTION)
    @IsString()
    @IsNotEmpty({ message: 'action 权限时 code 必传' })
    code?: string | null;

    @ApiProperty({ example: 'menu', enum: PERMISSION_TYPES })
    @IsString()
    @IsNotEmpty()
    @IsIn(PERMISSION_TYPES, { message: 'permissionType 必须为 menu 或 action' })
    permissionType: PermissionType;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) implements UpdatePermissionRequest {
    @ApiProperty({
        example: 'user:list',
        description: 'action 权限时必传',
        required: false,
    })
    @ValidateIf(o => o.permissionType === PERMISSION_TYPE_ACTION)
    @IsString()
    @IsNotEmpty({ message: 'action 权限时 code 必传' })
    code?: string | null;
}
