export const paginationResponse = async <T>(
  requestApi: Promise<{ list: T[]; total: number }>,
): Promise<{ success: boolean; data: T[]; total: number }> => {
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
};
