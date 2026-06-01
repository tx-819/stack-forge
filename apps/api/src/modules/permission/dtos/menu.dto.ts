import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PermissionDto } from './permission.dto';
import { Exclude } from 'class-transformer';

export class MenuTreeDto extends PermissionDto {
    @ApiHideProperty()
    @Exclude()
    declare code: string | null;

    @ApiProperty({ type: [() => MenuTreeDto] })
    @Type(() => MenuTreeDto)
    children: MenuTreeDto[] | null;
}
