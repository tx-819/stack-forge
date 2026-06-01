import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

import { IApiErrorResponse } from '../interfaces/response.interface';

export class ApiErrorResponseDto implements IApiErrorResponse {
    @ApiProperty({ description: 'HTTP status code', example: 200 })
    @Expose()
    @IsNumber()
    code: number;

    @ApiProperty({
        description: 'Response message',
        example: 'Operation successful',
    })
    @Expose()
    @IsString()
    message: string;

    @ApiProperty({
        description: 'Timestamp of the response',
        example: new Date().toISOString(),
    })
    @Expose()
    @Type(() => Date)
    timestamp: string;

    constructor(code: number, message: string, timestamp: string) {
        this.code = code;
        this.message = message;
        this.timestamp = timestamp;
    }
}
