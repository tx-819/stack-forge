import { ClassConstructor } from 'class-transformer';

export interface IPaginationMetadata {
    current: number;
    pageSize: number;
    total: number;
    totalPage: number;
}

interface IApiBaseResponse {
    code: number;
    message: string;
    timestamp: string;
}

export interface IApiSuccessResponse<T> extends IApiBaseResponse {
    data: T;
}

export interface IApiPaginatedData<T> {
    items: T[];
    metadata: IPaginationMetadata;
}

export interface IApiPaginatedResponse<T> extends IApiBaseResponse {
    data: IApiPaginatedData<T>;
}

export interface IApiErrorResponse extends IApiBaseResponse {
    error?: string | string[] | Record<string, unknown>;
}

export interface IResponseDocOptions<T> {
    serialization?: ClassConstructor<T>;
    isPublic?: boolean;
}
