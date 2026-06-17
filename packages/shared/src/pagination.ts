import type { PaginatedData, TableRequestResult } from '@stack-forge/contracts';

export async function toPaginationResult<T>(
  requestApi: Promise<PaginatedData<T>>,
): Promise<TableRequestResult<T>> {
  try {
    const response = await requestApi;
    return {
      success: true,
      data: response.list,
      total: response.total,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      data: [],
      total: 0,
    };
  }
}
