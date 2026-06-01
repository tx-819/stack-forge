import { Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import RefreshButton from "./RefreshButton";
import SizeChanger from "./SizeChanger";
import ColumnFilter from "./ColumnFilter";
import type { TableProps } from "antd";

interface SettingsProps {
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 是否显示表格大小切换 */
  showSizeChanger?: boolean;
  /** 是否显示列筛选 */
  showColumnFilter?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 表格列配置 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns?: ColumnsType<any>;
  /** 可见列的 key 列表 */
  visibleColumnKeys?: string[];
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 表格大小变化回调 */
  onSizeChange?: (size: TableProps["size"]) => void;
  /** 列可见性变化回调 */
  onColumnVisibilityChange?: (keys: string[]) => void;
}

const Settings = ({
  showRefresh = true,
  showSizeChanger = true,
  showColumnFilter = true,
  loading = false,
  columns = [],
  visibleColumnKeys = [],
  onRefresh,
  onSizeChange,
  onColumnVisibilityChange,
}: SettingsProps) => {
  return (
    <Space>
      {showRefresh && <RefreshButton loading={loading} onRefresh={onRefresh} />}
      {showSizeChanger && <SizeChanger onSizeChange={onSizeChange} />}
      {showColumnFilter && (
        <ColumnFilter
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          onColumnVisibilityChange={onColumnVisibilityChange}
        />
      )}
    </Space>
  );
};

export default Settings;
