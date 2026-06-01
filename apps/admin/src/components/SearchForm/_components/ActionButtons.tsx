import { Button, Space } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface ActionButtonsProps {
  /** 是否显示搜索按钮 */
  showSearchButton: boolean;
  /** 搜索按钮文本 */
  searchText: string;
  /** 是否显示重置按钮 */
  showResetButton: boolean;
  /** 重置按钮文本 */
  resetText: string;
  /** 是否显示折叠按钮 */
  showCollapseButton: boolean;
  /** 是否折叠 */
  collapsed: boolean;
  /** 搜索加载状态 */
  searchLoading: boolean;
  /** 搜索回调 */
  onSearch: () => void;
  /** 重置回调 */
  onReset: () => void;
  /** 切换折叠状态回调 */
  onToggleCollapse: () => void;
}

/**
 * 搜索表单操作按钮组件
 * 包含搜索、重置、折叠/展开按钮
 */
const ActionButtons = ({
  showSearchButton,
  searchText,
  showResetButton,
  resetText,
  showCollapseButton,
  collapsed,
  searchLoading,
  onSearch,
  onReset,
  onToggleCollapse,
}: ActionButtonsProps) => {
  const { t } = useTranslation();

  if (!showSearchButton && !showResetButton && !showCollapseButton) {
    return null;
  }

  return (
    <div style={{ flexShrink: 0 }} className="text-right">
      <Space>
        {showResetButton && <Button onClick={onReset}>{resetText}</Button>}
        {showSearchButton && (
          <Button type="primary" onClick={onSearch} loading={searchLoading}>
            {searchText}
          </Button>
        )}
        {showCollapseButton && (
          <Button
            type="link"
            onClick={onToggleCollapse}
            icon={collapsed ? <DownOutlined /> : <UpOutlined />}
          >
            {collapsed ? t("expand") : t("collapse")}
          </Button>
        )}
      </Space>
    </div>
  );
};

export default ActionButtons;
