import type {
  ColumnType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";
import type { SearchFormOptions, SearchFormItemConfig } from "../SearchForm";

export interface ProTableOptions {
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 刷新按钮文本 */
  refreshText?: string;
  /** 刷新回调 */
  onRefresh?: () => void | Promise<void>;
  /** 是否显示表格大小切换 */
  showSizeChanger?: boolean;
  /** 是否显示列筛选 */
  showColumnFilter?: boolean;
}

export interface ProColumnType<
  RecordType = unknown,
> extends ColumnType<RecordType> {
  /** 搜索表单项配置 */
  formItem?: Omit<SearchFormItemConfig, "name" | "label">;
}

export interface ProTablePaginationConfig extends Omit<
  TablePaginationConfig,
  "current" | "defaultCurrent"
> {
  page: number;
  defaultPage?: number;
}

export interface ProTableRequestParams {
  page?: number;
  pageSize?: number;
}

export interface ProTableProps<
  T = unknown,
  P extends ProTableRequestParams = ProTableRequestParams,
> extends Omit<TableProps<T>, "dataSource" | "loading" | "title" | "columns"> {
  /** 数据源 */
  dataSource?: T[];
  /** 加载状态 */
  loading?: boolean;
  /** 数据请求函数 */
  request?: (
    params?: P,
  ) => Promise<{ data: T[]; success: boolean; total?: number }>;
  /** 请求参数 */
  params?: P;
  /** 表格选项配置 */
  options?: ProTableOptions;
  /** 表格标题 */
  title?: string | TableProps<T>["title"];
  /** 搜索表单，默认为 true（自动显示），可传入 false 禁用或传入配置对象 */
  search?: false | true | SearchFormOptions;
  /** 表格列配置 */
  columns?: ProColumnType<T>[];
  /** 分页配置 */
  pagination?: false | ProTablePaginationConfig;
}

export interface ProTableRef {
  /** 刷新数据 */
  refresh: () => Promise<void>;
}
