import { ApiProperty, PickType } from '@nestjs/swagger';
import {
    IsArray,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { UserDto } from 'src/modules/user/dtos/user.dto';
import { Type } from 'class-transformer';
import { faker } from '@faker-js/faker';

export class RegisterDto extends PickType(UserDto, [
    'username',
    'nickname',
    'avatar',
]) {
    @ApiProperty({
        example: faker.internet.email(),
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: faker.internet.password(),
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        example: [1],
    })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    rolesIds: number[];
}

export class LoginDto {
    @ApiProperty({ description: '用户名', example: 'admin' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ description: '密码', example: '123456' })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class AuthResponseDto {
    @ApiProperty({ description: '访问令牌' })
    @IsString()
    @IsNotEmpty()
    accessToken: string;

    @ApiProperty({ description: '用户信息' })
    @Type(() => UserDto)
    user: UserDto;
}

export class SendLoginEmailDto {
    @ApiProperty({ description: '邮箱', example: 'test@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class WechatMiniLoginDto {
    @ApiProperty({ description: 'wx.login 返回的临时登录凭证 code' })
    @IsString()
    @IsNotEmpty()
    code: string;
}

export class WechatAuthResponseDto extends AuthResponseDto {
    @ApiProperty({
        description: '刷新令牌（小程序不支持 Cookie 时返回）',
        required: false,
    })
    @IsString()
    @IsOptional()
    refreshToken?: string;
}

export class UpdateWechatProfileDto {
    @ApiProperty({ description: '昵称', required: false })
    @IsString()
    @IsOptional()
    nickname?: string;

    @ApiProperty({ description: '头像（已上传后的 URL）', required: false })
    @IsString()
    @IsOptional()
    avatar?: string;
}

export class WechatPhoneCodeDto {
    @ApiProperty({
        description: 'getPhoneNumber 回调返回的 code（非 wx.login 的 code）',
    })
    @IsString()
    @IsNotEmpty()
    code: string;
}

export class BindEmailDto {
    @ApiProperty({ description: '要绑定的邮箱', example: 'test@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ActionDto {
    @ApiProperty({ description: '权限标识' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: '权限名称' })
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class ActionListDto {
    @ApiProperty({ description: '页面路径（全路径）' })
    @IsString()
    @IsNotEmpty()
    pathname: string;

    @ApiProperty({ description: '操作列表' })
    @Type(() => ActionDto)
    actions: ActionDto[];
}
