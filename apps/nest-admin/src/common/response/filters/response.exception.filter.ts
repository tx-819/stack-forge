import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ApiErrorResponseDto } from '../dtos/response.error.dto';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ResponseExceptionFilter.name);
    constructor() {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const statusCode =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        let message = '';

        if (exception instanceof BadRequestException) {
            const exceptionResponse = exception.getResponse() as any;
            const exceptionMessage = exceptionResponse.message;

            if (Array.isArray(exceptionMessage)) {
                message = exceptionMessage.join(', ');
            } else {
                message = exceptionMessage || 'Bad Request';
            }
        } else if (exception instanceof HttpException) {
            message = exception.message;
        } else {
            message = 'Internal Server Error';
        }

        // Log errors
        if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `${request.method} ${request.url} - ${statusCode}: ${message}`,
                exception instanceof Error ? exception.stack : undefined
            );
        } else if (statusCode >= HttpStatus.BAD_REQUEST) {
            this.logger.warn(
                `${request.method} ${request.url} - ${statusCode}: ${message}`
            );
        }

        const responseBody = new ApiErrorResponseDto(
            statusCode,
            message,
            new Date().toISOString()
        );

        response.status(statusCode).json(responseBody);
    }
}
