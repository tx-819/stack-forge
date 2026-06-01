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
import { RoleService } from '../services/role.service';
import { ApiOperation } from '@nestjs/swagger';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import {
    CreateRoleDto,
    RoleDto,
    SetRolePermissionsDto,
    UpdateRoleDto,
    RoleListQueryDto,
} from '../dtos/role.dto';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { PermissionDto } from 'src/modules/permission/dtos/permission.dto';

@Controller('role')
export class RoleController {
    constructor(private roleService: RoleService) {}

    @Get('/page')
    @ApiOperation({ summary: '获取角色列表' })
    @DocPaginatedResponse({ serialization: RoleDto })
    getRoles(
        @Query() query: RoleListQueryDto
    ): Promise<ApiPaginatedDataDto<RoleDto>> {
        return this.roleService.getRoles(query);
    }

    @Get(':id/permissions')
    @ApiOperation({ summary: '查询当前角色已有的权限' })
    @DocResponse({ serialization: PermissionDto })
    getRolePermissions(@Param('id', ParseIntPipe) id: number) {
        return this.roleService.getPermissions(id);
    }

    @Put(':id/permissions')
    @ApiOperation({ summary: '为当前角色设置权限' })
    @DocResponse()
    async setRolePermissions(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: SetRolePermissionsDto
    ): Promise<void> {
        await this.roleService.setPermissions(id, dto);
    }

    @Get(':id')
    @ApiOperation({ summary: '获取角色详情' })
    @DocResponse()
    getRoleDetail(@Param('id', ParseIntPipe) id: number) {
        return this.roleService.detail(id);
    }

    @Post()
    @ApiOperation({ summary: '创建角色' })
    @DocResponse()
    async createRole(@Body() createRoleDto: CreateRoleDto): Promise<void> {
        await this.roleService.create(createRoleDto);
    }

    @Put(':id')
    @ApiOperation({ summary: '更新角色' })
    @DocResponse()
    async updateRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRoleDto: UpdateRoleDto
    ): Promise<void> {
        await this.roleService.update(id, updateRoleDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: '删除角色' })
    @DocResponse()
    async deleteRole(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.roleService.delete(id);
    }
}
