import { applyDecorators, SerializeOptions } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiResponse,
    getSchemaPath,
} from '@nestjs/swagger';

import {
    ApiPaginatedDataDto,
    ApiPaginationMetadataDto,
} from 'src/common/response/dtos/response.paginated.dto';
import { ApiSuccessResponseDto } from 'src/common/response/dtos/response.success.dto';
import { IResponseDocOptions } from 'src/common/response/interfaces/response.interface';

export function DocPaginatedResponse<T>(
    options?: IResponseDocOptions<T>
): MethodDecorator {
    const { serialization, isPublic } = options || {};

    const schema: Record<string, any> = {
        allOf: [
            { $ref: getSchemaPath(ApiSuccessResponseDto) },
            {
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: {
                        type: 'string',
                        example: 'Success',
                    },
                    timestamp: {
                        type: 'string',
                        example: new Date().toISOString(),
                    },
                    data: {
                        type: 'object',
                        properties: {
                            list: {
                                type: 'array',
                                items: serialization
                                    ? { $ref: getSchemaPath(serialization) }
                                    : {},
                            },
                            total: {
                                type: 'number',
                                example: 100,
                            },
                        },
                    },
                },
            },
        ],
    };

    const decorators = [
        ApiExtraModels(
            ApiSuccessResponseDto,
            ApiPaginatedDataDto,
            ApiPaginationMetadataDto
        ),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema,
        }),
    ];

    if (!isPublic) {
        decorators.push(ApiBearerAuth('accessToken'));
    }

    if (serialization) {
        decorators.push(ApiExtraModels(serialization));
        decorators.push(SerializeOptions({ type: serialization }));
    }

    return applyDecorators(...decorators);
}
