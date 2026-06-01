import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    ClassSerializerInterceptor,
    PlainLiteralObject,
    StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClassTransformOptions } from 'class-transformer';
import { isArray, isNil, isObject } from 'lodash';
import { Observable, map } from 'rxjs';
import dayjs from 'dayjs';
import { ApiSuccessResponseDto } from '../dtos/response.success.dto';

@Injectable()
export class ResponseInterceptor
    extends ClassSerializerInterceptor
    implements NestInterceptor
{
    constructor(reflector: Reflector) {
        super(reflector);
    }

    serialize(
        response: PlainLiteralObject | Array<PlainLiteralObject>,
        options: ClassTransformOptions
    ): PlainLiteralObject | PlainLiteralObject[] {
        if (
            (!isObject(response) && !isArray(response)) ||
            response instanceof StreamableFile
        ) {
            return response;
        }

        // 如果是响应数据是数组,则遍历对每一项进行序列化
        if (isArray(response)) {
            return (response as PlainLiteralObject[]).map(item =>
                !isObject(item) ? item : this.transformToPlain(item, options)
            );
        }
        // 如果是分页数据,则对items中的每一项进行序列化
        if ('list' in response && 'total' in response) {
            const list =
                !isNil(response.list) && isArray(response.list)
                    ? response.list
                    : [];
            return {
                ...response,
                list: (list as PlainLiteralObject[]).map(item => {
                    return !isObject(item)
                        ? item
                        : this.transformToPlain(item, options);
                }),
            };
        }
        // 如果响应是个对象则直接序列化
        return this.transformToPlain(response, options);
    }

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<unknown> {
        const contextOptions = this.getContextOptions(context);
        const options = {
            ...this.defaultOptions,
            ...contextOptions,
        };

        return next.handle().pipe(
            map(responseBody => {
                const ctx = context.switchToHttp();
                const response = ctx.getResponse();
                response.status(200);

                const data = this.serialize(responseBody, options);

                const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
                return new ApiSuccessResponseDto(
                    200,
                    'Success',
                    timestamp,
                    data
                );
            })
        );
    }
}
