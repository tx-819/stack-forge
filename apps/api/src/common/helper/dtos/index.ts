import { Transform } from 'class-transformer';
import { IsInt, Min, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { IPaginationParams } from '../interfaces/pagination.interface';
import dayjs from 'dayjs';
import type { BaseEntity, PaginationParams } from '@stack-forge/contracts';

export class PaginationParamsDto
    implements IPaginationParams, PaginationParams
{
    @ApiProperty({
        example: 1,
    })
    @IsInt()
    @Min(1)
    @Transform(({ value }) => Number(value))
    page: number;

    @ApiProperty({
        example: 10,
    })
    @IsInt()
    @Min(1)
    @Transform(({ value }) => Number(value))
    pageSize: number;
}

export class BaseDto implements BaseEntity {
    @ApiProperty({
        example: 1,
    })
    @IsNumber()
    id: number;

    @ApiProperty({
        example: faker.date.past().toISOString(),
    })
    @Transform(({ value }) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'), {
        toPlainOnly: true,
    })
    createdAt: string;

    @ApiProperty({
        example: faker.date.recent().toISOString(),
    })
    @Transform(({ value }) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'), {
        toPlainOnly: true,
    })
    updatedAt: string;
}
