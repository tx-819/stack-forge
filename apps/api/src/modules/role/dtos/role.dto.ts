import { faker } from '@faker-js/faker';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    IsNotEmpty,
    MaxLength,
} from 'class-validator';
import { BaseDto } from 'src/common/helper/dtos';
import { PickType } from '@nestjs/swagger';
import { PaginationParamsDto } from 'src/common/helper/dtos';
import type {
    CreateRoleRequest,
    Role as ContractRole,
    RoleListQuery,
    SetRolePermissionsRequest,
    UpdateRoleRequest,
} from '@stack-forge/contracts';

export class RoleDto extends BaseDto implements ContractRole {
    @ApiProperty({
        example: faker.person.jobTitle(),
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'admin',
    })
    @IsString()
    code: string;

    @ApiProperty({
        example: faker.lorem.sentence(),
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    remark: string | null;

    @ApiProperty({
        example: faker.helpers.arrayElement([true, false]),
    })
    @IsBoolean()
    @IsOptional()
    status: boolean;
}

export class CreateRoleDto extends PickType(RoleDto, ['name', 'code', 'remark', 'status']) implements CreateRoleRequest {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    code: string;
}

export class UpdateRoleDto extends PartialType(PickType(RoleDto, ['name', 'code', 'remark', 'status'])) implements UpdateRoleRequest {}

export class RoleListQueryDto extends PaginationParamsDto implements RoleListQuery {
    @ApiProperty({
        example: faker.person.jobTitle(),
        required: false,
        description: '角色名称模糊搜索',
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        example: 'admin',
        required: false,
        description: '角色代码模糊搜索',
    })
    @IsString()
    @IsOptional()
    code?: string;
}

/** 为角色设置权限（会清空该角色原有权限） */
export class SetRolePermissionsDto implements SetRolePermissionsRequest {
    @ApiProperty({ example: [1, 2, 3], description: '权限 id 列表' })
    @IsArray()
    @IsInt({ each: true })
    permissionIds: number[];
}
