export type DateTimeString = string;

export interface ApiResponse<T> {
  code: number;
  message: string;
  timestamp?: string;
  data: T;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
}

export interface TableRequestResult<T> {
  success: boolean;
  data: T[];
  total: number;
}

export interface BaseEntity {
  id: number;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}
