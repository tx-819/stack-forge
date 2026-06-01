import type { ProColumnType } from "../types";
import { useEffect, useMemo, useState } from "react";
import type { TableProps } from "antd";

interface UseTableSettingsOptions {
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 是否显示表格大小切换 */
  showSizeChanger?: boolean;
  /** 是否显示列筛选 */
  showColumnFilter?: boolean;
}

interface UseTableSettingsProps<T = unknown> {
  /** 表格列配置 */
  columns?: ProColumnType<T>[];
  /** 初始表格大小 */
  initialSize?: TableProps["size"];
  /** Settings 选项配置 */
  options?: UseTableSettingsOptions;
}

// 获取初始表格大小
const getInitialSize = (size?: TableProps["size"]): TableProps["size"] => {
  if (size) {
    return size;
  }
  return "middle";
};

// 获取列的标识符（优先使用 dataIndex，如果没有则使用 key）
export function getColumnIdentifier<T>(col: ProColumnType<T>): string | null {
  // 检查是否是 ColumnType（有 dataIndex 属性）
  // ColumnGroupType 没有 dataIndex，只有 ColumnType 有
  if (
    "dataIndex" in col &&
    col.dataIndex !== undefined &&
    col.dataIndex !== null
  ) {
    const dataIndex = col.dataIndex;
    if (typeof dataIndex === "string") {
      return dataIndex;
    }
    if (typeof dataIndex === "number") {
      return String(dataIndex);
    }
    if (Array.isArray(dataIndex)) {
      return dataIndex.join(".");
    }
  }
  // 如果没有 dataIndex，使用 key
  if (col.key !== undefined && col.key !== null) {
    return String(col.key);
  }
  return null;
}

export function getInitialVisibleColumns<T>(
  columns?: ProColumnType<T>[],
): string[] {
  if (!columns) return [];
  return columns
    .map((col) => getColumnIdentifier(col))
    .filter((id): id is string => id !== null);
}

const useTableSettings = <T = unknown>({
  columns,
  initialSize,
  options = {},
}: UseTableSettingsProps<T>) => {
  const {
    showRefresh = true,
    showSizeChanger = true,
    showColumnFilter = true,
  } = options;

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() =>
    getInitialVisibleColumns(columns),
  );

  const [tableSize, setTableSize] = useState<TableProps["size"]>(
    getInitialSize(initialSize),
  );

  // 当 columns 变化时，更新可见列
  useEffect(() => {
    if (columns) {
      const initialKeys = getInitialVisibleColumns(columns);
      setVisibleColumnKeys((prev) => {
        // 如果当前没有可见列，或者所有当前可见的列都不在新的 columns 中，则重置
        if (
          prev.length === 0 ||
          !prev.some((key) => initialKeys.includes(key))
        ) {
          return initialKeys;
        }
        // 否则只保留仍然存在的列
        return prev.filter((key) => initialKeys.includes(key));
      });
    }
  }, [columns]);

  // 根据可见列过滤 columns
  const filteredColumns = useMemo((): ProColumnType<T>[] | undefined => {
    if (!columns || !showColumnFilter) {
      return columns;
    }

    return columns.filter((col) => {
      const identifier = getColumnIdentifier(col);
      // 如果没有标识符（既没有 dataIndex 也没有 key），默认显示
      if (identifier === null) {
        return true;
      }
      // 根据 visibleColumnKeys 决定是否显示
      return visibleColumnKeys.includes(identifier);
    }) as ProColumnType<T>[];
  }, [columns, visibleColumnKeys, showColumnFilter]);

  return {
    /** 当前表格大小 */
    tableSize,
    /** 过滤后的列配置 */
    filteredColumns,
    /** Settings 选项配置 */
    settingsOptions: {
      showRefresh,
      showSizeChanger,
      showColumnFilter,
      visibleColumnKeys,
      columns,
      onSizeChange: (size: TableProps["size"]) => setTableSize(size),
      onColumnVisibilityChange: (keys: string[]) => setVisibleColumnKeys(keys),
    },
  };
};

export default useTableSettings;
