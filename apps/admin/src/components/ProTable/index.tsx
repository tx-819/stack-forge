import { useImperativeHandle, forwardRef, useMemo } from "react";
import { Space, Table } from "antd";
import Settings from "./_components/Settings";
import useNormalizedProps from "./_hooks/useNormalizedProps";
import type { ProTableProps, ProTableRef, ProTableRequestParams } from "./types";
import SearchForm from "../SearchForm";
import type { SearchFormOptions } from "../SearchForm";
import { theme } from "antd";

function ProTableInner<T = unknown, P extends ProTableRequestParams = ProTableRequestParams>(
  props: ProTableProps<T, P>,
  ref: React.ForwardedRef<ProTableRef>
) {
  const {
    dataSource,
    loading,
    columns,
    refMethods,
    settingsOptions,
    search: searchOptions,
    onSearch,
    onReset,
    title,
    toolBarRender,
    ...tableProps
  } = useNormalizedProps(props);

  const { showRefresh, showSizeChanger, showColumnFilter } = settingsOptions;

  useImperativeHandle(ref, () => refMethods);

  const { token: { colorBgContainer } } = theme.useToken();

  const titleContent = useMemo(() => {
    if (!title) {
      return null;
    }

    if (typeof title === "function") {
      return title(dataSource);
    }

    return <span className="text-lg font-bold">{title}</span>;
  }, [dataSource, title]);

  const toolBarActions = useMemo(() => {
    if (toolBarRender === false) {
      return [];
    }

    return toolBarRender?.() ?? [];
  }, [toolBarRender]);

  const shouldShowSettings =
    showRefresh || showSizeChanger || showColumnFilter;
  const shouldShowToolBar =
    !!titleContent || toolBarActions.length > 0 || shouldShowSettings;

  // 判断是否显示搜索表单：默认显示（当 search 不是 false 且有 formItem 的列时）
  const shouldShowSearch = useMemo(() => {
    if (searchOptions === false) {
      return false;
    }
    // 检查是否有列配置了 formItem
    return columns?.some((column) => column.formItem) ?? false;
  }, [columns, searchOptions]);

  // 构建搜索表单项
  const searchItems = useMemo(() => {
    if (!columns || !shouldShowSearch) {
      return [];
    }

    return columns
      .map((column) => {
        // 如果没有 formItem 配置，跳过
        if (!column.formItem) {
          return null;
        }

        // 处理 dataIndex，可能是 string、number 或 array
        let name: string | string[] | undefined;
        if (column.dataIndex !== undefined && column.dataIndex !== null) {
          if (typeof column.dataIndex === "string") {
            name = column.dataIndex;
          } else if (typeof column.dataIndex === "number") {
            name = String(column.dataIndex);
          } else if (Array.isArray(column.dataIndex)) {
            name = column.dataIndex.map(String);
          }
        } else if (column.key !== undefined && column.key !== null) {
          name = String(column.key);
        }

        // 处理 title，可能是 string、ReactNode 或函数
        let label: string | undefined;
        if (typeof column.title === "string") {
          label = column.title;
        } else if (column.title === undefined || column.title === null) {
          label = undefined;
        } else {
          // 如果是 ReactNode 或函数，尝试提取文本或使用默认值
          label = name as string | undefined;
        }

        // 如果没有 name，跳过
        if (!name) {
          return null;
        }

        return {
          ...column.formItem,
          name,
          label,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [columns, shouldShowSearch]);

  return (
    <>
      {shouldShowSearch && (
        <SearchForm
          items={searchItems}
          options={
            searchOptions === true || searchOptions === undefined
              ? undefined
              : (searchOptions as SearchFormOptions)
          }
          onSearch={(values) => onSearch?.(values as P)}
          onReset={onReset}
        />
      )}
      <div className="rounded-lg shadow-md p-4" style={{ background: colorBgContainer }}>
        {shouldShowToolBar && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">{titleContent}</div>
            <Space wrap>
              {toolBarActions}
              {shouldShowSettings && <Settings {...settingsOptions} />}
            </Space>
          </div>
        )}
        <Table
          {...tableProps}
          columns={columns}
          dataSource={dataSource}
          loading={loading}
        />
      </div>
    </>
  );
}

const ProTable = forwardRef(ProTableInner) as <T = unknown, P extends ProTableRequestParams = ProTableRequestParams>(
  props: ProTableProps<T, P> & { ref?: React.ForwardedRef<ProTableRef> }
) => React.ReactElement;

(ProTable as typeof ProTable & { displayName: string }).displayName =
  "ProTable";

export default ProTable;
