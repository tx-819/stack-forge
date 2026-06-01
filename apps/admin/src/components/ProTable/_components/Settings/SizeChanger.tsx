import { Button, Dropdown, Popover } from "antd";
import { ColumnHeightOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import type { TableProps } from "antd";

interface SizeChangerProps {
  /** 当前表格大小 */
  tableSize?: TableProps["size"];
  /** 表格大小变化回调 */
  onSizeChange?: (size: TableProps["size"]) => void;
}

const SizeChanger = ({ onSizeChange }: SizeChangerProps) => {
  const { t } = useTranslation();

  // 表格大小菜单项
  const sizeMenuItems: MenuProps["items"] = [
    {
      key: "small",
      label: t("tableSettings.size.small"),
      onClick: () => onSizeChange?.("small"),
    },
    {
      key: "middle",
      label: t("tableSettings.size.middle"),
      onClick: () => onSizeChange?.("middle"),
    },
    {
      key: "large",
      label: t("tableSettings.size.large"),
      onClick: () => onSizeChange?.("large"),
    },
  ];

  return (
    <Dropdown
      menu={{ items: sizeMenuItems, selectable: true }}
      trigger={["click"]}
    >
      <Popover content={t("tableSettings.density")} trigger="hover">
        <Button icon={<ColumnHeightOutlined />} type="text" />
      </Popover>
    </Dropdown>
  );
};

export default SizeChanger;
