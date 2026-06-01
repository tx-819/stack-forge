import type { ProTableProps, ProTableRequestParams } from "../types";
import type { TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import useTableSettings from "./useTableSettings";
import type { ProTablePaginationConfig } from "../types";

const useNormalizedProps = <
  T = unknown,
  P extends ProTableRequestParams = ProTableRequestParams,
>(
  props: ProTableProps<T, P>,
) => {
  const { t } = useTranslation();
  const {
    request,
    params,
    options,
    columns,
    size,
    dataSource: externalDataSource,
    loading: externalLoading,
    pagination: externalPagination,
    search: searchOptions,
    ...rest
  } = props;

  const [dataSource, setDataSource] = useState<T[]>(props.dataSource || []);
  const [loading, setLoading] = useState(false);
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState<Partial<P>>({});

  // 使用 ref 存储 request 和 params，避免因引用变化导致不必要的重新加载
  const requestRef = useRef(request);
  const paramsRef = useRef(params);

  // 更新 ref 的值
  useEffect(() => {
    requestRef.current = request;
    paramsRef.current = params;
  }, [request, params]);

  // 分页状态管理
  const [paginationState, setPaginationState] = useState(() => {
    if (externalPagination === false) {
      return { page: 1, pageSize: 10, total: 0 };
    }
    return {
      page: externalPagination?.page || externalPagination?.defaultPage || 1,
      pageSize:
        externalPagination?.pageSize ||
        externalPagination?.defaultPageSize ||
        10,
      total: externalPagination?.total || 0,
    };
  });

  const {
    filteredColumns,
    settingsOptions: tableSettingsOptions,
    tableSize,
  } = useTableSettings({
    columns,
    initialSize: size,
    options,
  });

  const finalLoading =
    externalLoading !== undefined ? externalLoading : loading;

  // 使用 ref 存储最新的分页状态，避免依赖问题
  const paginationStateRef = useRef(paginationState);
  useEffect(() => {
    paginationStateRef.current = paginationState;
  }, [paginationState]);

  // 加载数据，自动支持分页
  const loadData = useCallback(
    async (page?: number, pageSize?: number, overrideSearchParams?: P) => {
      // 使用 ref 获取最新的 request 和 params，避免依赖项变化
      const currentRequest = requestRef.current;
      const currentParams = paramsRef.current;

      if (!currentRequest) {
        // 如果没有 request 函数，使用外部传入的 dataSource
        if (externalDataSource) {
          setDataSource(externalDataSource);
        }
        return;
      }

      // 使用传入的分页参数或从 ref 中获取最新状态
      const currentPage = page ?? paginationStateRef.current.page;
      const currentPageSize = pageSize ?? paginationStateRef.current.pageSize;

      try {
        setLoading(true);
        // 合并请求参数，自动添加分页参数和搜索参数
        // 如果提供了 overrideSearchParams，优先使用它
        const requestParams = {
          ...currentParams,
          ...(overrideSearchParams !== undefined
            ? overrideSearchParams
            : searchParams),
          page: currentPage,
          pageSize: currentPageSize,
        };

        const result = await currentRequest(requestParams as P);

        setDataSource(result.data || []);

        // 更新分页状态，使用计算好的值而不是再次使用 ?? 操作符
        setPaginationState((prev) => ({
          page: currentPage,
          pageSize: currentPageSize,
          total: result.total !== undefined ? result.total : prev.total,
        }));
      } catch (error) {
        console.error("ProTable loadData error:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchParams, externalDataSource],
  );

  const handleRefresh = async () => {
    if (options?.onRefresh) {
      await options.onRefresh();
    }
    await loadData();
  };

  // 处理分页变化
  const handleTableChange = useCallback(
    (newPagination: TablePaginationConfig) => {
      const { current, pageSize } = newPagination;
      const prevState = paginationStateRef.current;
      const targetPage = current ?? prevState.page;
      const targetPageSize = pageSize ?? prevState.pageSize;
      loadData(targetPage, targetPageSize);
    },
    [loadData],
  );

  // 合并分页配置
  const pagination: false | TablePaginationConfig = useMemo(() => {
    if (externalPagination === false) {
      return false;
    }

    // 使用外部传入的分页配置或空对象
    const basePagination =
      (externalPagination as ProTablePaginationConfig) || {};

    return {
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => t("pagination.total", { total }),
      ...basePagination,
      page: paginationState.page,
      pageSize: paginationState.pageSize,
      total: paginationState.total,
      onChange: (page: number, size: number) => {
        if (basePagination.onChange) {
          basePagination.onChange(page, size);
        }
        handleTableChange({ current: page, pageSize: size });
      },
      onShowSizeChange: (current: number, size: number) => {
        if (basePagination.onShowSizeChange) {
          basePagination.onShowSizeChange(current, size);
        }
        handleTableChange({ current, pageSize: size });
      },
    };
  }, [externalPagination, paginationState, handleTableChange, t]);

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 处理搜索
  const handleSearch = useCallback(
    async (values: P) => {
      const currentPageSize = paginationStateRef.current.pageSize;
      // 搜索时重置到第一页
      setPaginationState((prev) => ({
        ...prev,
        page: 1,
      }));
      // 更新搜索参数
      setSearchParams(values);
      // 直接使用新的搜索参数加载数据
      await loadData(1, currentPageSize, values);
    },
    [loadData],
  );

  // 处理重置
  const handleReset = useCallback(async () => {
    const currentPageSize = paginationStateRef.current.pageSize;
    // 重置时重置到第一页
    setPaginationState((prev) => ({
      ...prev,
      page: 1,
    }));
    // 清空搜索参数
    setSearchParams({});
    // 直接使用空的搜索参数加载数据
    await loadData(1, currentPageSize, {} as P);
  }, [loadData]);

  return {
    rowKey: "id",
    ...rest,
    settingsOptions: {
      ...tableSettingsOptions,
      onRefresh: handleRefresh,
      loading: finalLoading,
    },
    dataSource,
    loading: finalLoading,
    size: tableSize,
    columns: filteredColumns,
    pagination,
    onChange: handleTableChange,
    search: searchOptions,
    searchParams,
    onSearch: handleSearch,
    onReset: handleReset,
    refMethods: {
      refresh: handleRefresh,
    },
  };
};

export default useNormalizedProps;
