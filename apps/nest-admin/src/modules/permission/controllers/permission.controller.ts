import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
} from '@nestjs/common';
import { PermissionService } from '../services/permission.service';
import { ApiOperation } from '@nestjs/swagger';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import {
    CreatePermissionDto,
    PermissionDto,
    PermissionTreeDto,
    UpdatePermissionDto,
} from '../dtos/permission.dto';

@Controller('permission')
export class PermissionController {
    constructor(private permissionService: PermissionService) {}

    @Get('/tree')
    @ApiOperation({ summary: '获取权限树（不分页）' })
    @DocResponse({ serialization: PermissionTreeDto })
    getTree(): Promise<PermissionTreeDto[]> {
        return this.permissionService.getTree();
    }

    @Get(':id')
    @ApiOperation({ summary: '获取权限详情' })
    @DocResponse({ serialization: PermissionDto })
    getDetail(@Param('id', ParseIntPipe) id: number) {
        return this.permissionService.detail(id);
    }

    @Post()
    @ApiOperation({ summary: '新增权限' })
    @DocResponse()
    async create(
        @Body() createPermissionDto: CreatePermissionDto
    ): Promise<void> {
        await this.permissionService.create(createPermissionDto);
    }

    @Put(':id')
    @ApiOperation({ summary: '修改权限' })
    @DocResponse()
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updatePermissionDto: UpdatePermissionDto
    ): Promise<void> {
        await this.permissionService.update(id, updatePermissionDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: '删除权限' })
    @DocResponse()
    async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.permissionService.delete(id);
    }
}
