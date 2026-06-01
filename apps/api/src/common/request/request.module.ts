import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

@Module({
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                whitelist: true, // 自动过滤掉 DTO 中未声明的属性
                forbidNonWhitelisted: false, // 不因多余参数报错，只做过滤
                transform: true,
            }),
        },
    ],
})
export class RequestModule {}
