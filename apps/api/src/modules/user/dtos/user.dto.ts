import { faker } from '@faker-js/faker';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import {
    IsEmail,
    IsBoolean,
    IsOptional,
    IsString,
    IsArray,
    ValidateNested,
    IsInt,
} from 'class-validator';
import { BaseDto, PaginationParamsDto } from 'src/common/helper/dtos';
import { PickType } from '@nestjs/swagger';
import { RoleDto } from 'src/modules/role/dtos/role.dto';
import type {
    CreateUserRequest,
    UpdateUserRequest,
    User as ContractUser,
    UserListQuery,
    UserWithRoles,
} from '@stack-forge/contracts';

export class UserDto extends BaseDto implements ContractUser {
    @ApiProperty({
        example: faker.internet.email(),
        required: false,
        nullable: true,
    })
    @IsEmail()
    @IsOptional()
    email: string | null;

    @ApiProperty({
        example: faker.image.avatar(),
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    avatar: string | null;

    @ApiProperty({
        example: faker.internet.username(),
    })
    @IsString()
    username: string;

    @ApiProperty({
        example: faker.person.fullName(),
    })
    @IsString()
    @IsOptional()
    nickname: string | null;

    @ApiProperty({
        example: faker.phone.number(),
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    phone: string | null;

    @ApiProperty({
        description: '微信 openid',
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    openid: string | null;

    @ApiProperty({
        description: '微信开放平台 unionid',
        required: false,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    unionid: string | null;

    @ApiProperty({
        example: faker.helpers.arrayElement([true, false]),
    })
    @IsBoolean()
    @IsOptional()
    status: boolean;

    @ApiHideProperty()
    @Exclude()
    password?: string | null;

    @ApiProperty({
        example: faker.helpers.arrayElement([true, false]),
    })
    @IsBoolean()
    @IsOptional()
    isSuper: boolean;
}

export class CreateUserDto extends PickType(UserDto, [
    'username',
    'nickname',
    'avatar',
]) implements CreateUserRequest {
    @ApiProperty({
        example: faker.internet.email(),
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: faker.internet.password(),
    })
    @IsString()
    @IsOptional()
    password: string;

    @ApiProperty({
        example: [1],
    })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    roleIds?: number[];

    @ApiProperty({
        example: [1],
        required: false,
        deprecated: true,
        description: 'Deprecated. Use roleIds instead.',
    })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    rolesIds?: number[];
}

export class UpdateUserDto extends PickType(UserDto, [
    'nickname',
    'email',
    'avatar',
    'status',
]) implements UpdateUserRequest {
    @ApiProperty({
        example: [1],
    })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    roleIds?: number[];
}

export class UserListQueryDto extends PaginationParamsDto implements UserListQuery {
    @ApiProperty({
        example: faker.internet.username(),
        required: false,
        description: '用户名模糊搜索',
    })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({
        example: faker.person.fullName(),
        required: false,
        description: '昵称模糊搜索',
    })
    @IsString()
    @IsOptional()
    nickname?: string;
}

export class UserWithRolesDto extends UserDto implements UserWithRoles {
    @ApiProperty({
        type: [RoleDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoleDto)
    roles: RoleDto[];
}
