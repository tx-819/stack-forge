import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { ApiOperation } from '@nestjs/swagger';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import {
    CreateUserDto,
    UpdateUserDto,
    UserListQueryDto,
    UserWithRolesDto,
} from '../dtos/user.dto';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';

@Controller('user')
export class UserController {
    constructor(private userService: UserService) {}

    @Get('/page')
    @ApiOperation({ summary: '获取用户列表' })
    @DocPaginatedResponse({ serialization: UserWithRolesDto })
    getUsers(
        @Query() query: UserListQueryDto
    ): Promise<ApiPaginatedDataDto<UserWithRolesDto>> {
        return this.userService.getUsers(query);
    }

    @Get(':id')
    @ApiOperation({ summary: '获取用户详情' })
    @DocResponse({ serialization: UserWithRolesDto })
    getDetail(@Param('id', ParseIntPipe) id: number) {
        return this.userService.detailWithRoles(id);
    }

    @Post()
    @ApiOperation({ summary: '创建用户' })
    @DocResponse()
    async createUser(@Body() createUserDto: CreateUserDto): Promise<void> {
        await this.userService.create(createUserDto);
    }

    @Put(':id')
    @ApiOperation({ summary: '更新用户' })
    @DocResponse()
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto
    ): Promise<void> {
        await this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: '删除用户' })
    @DocResponse()
    async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.userService.delete(id);
    }
}
