import { Button, Dropdown, Checkbox, Popover } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { getColumnIdentifier } from "../../_hooks/useTableSettings";

interface ColumnFilterProps {
  /** 表格列配置 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns?: ColumnsType<any>;
  /** 可见列的 key 列表 */
  visibleColumnKeys?: string[];
  /** 列可见性变化回调 */
  onColumnVisibilityChange?: (keys: string[]) => void;
}

const ColumnFilter = ({
  columns = [],
  visibleColumnKeys = [],
  onColumnVisibilityChange,
}: ColumnFilterProps) => {
  const { t } = useTranslation();
  // 处理列可见性变化
  const handleColumnVisibilityChange = (key: string, checked: boolean) => {
    if (!onColumnVisibilityChange) return;

    if (checked) {
      // 添加列
      onColumnVisibilityChange([...visibleColumnKeys, key]);
    } else {
      // 移除列
      onColumnVisibilityChange(visibleColumnKeys.filter((k) => k !== key));
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (!onColumnVisibilityChange || !columns) return;

    if (checked) {
      // 全选：获取所有列的标识符（dataIndex 或 key）
      const allKeys = columns
        .map((col) => getColumnIdentifier(col))
        .filter((id): id is string => id !== null);
      onColumnVisibilityChange(allKeys);
    } else {
      // 取消全选
      onColumnVisibilityChange([]);
    }
  };

  // 构建列筛选菜单项
  const getColumnFilterMenuItems = (): MenuProps["items"] => {
    if (!columns || columns.length === 0) {
      return [
        {
          key: "no-columns",
          label: t("tableSettings.noColumns"),
          disabled: true,
        },
      ];
    }

    // 获取所有可筛选的列（有 dataIndex 或 key 的列）
    const filterableColumns = columns.filter(
      (col) => getColumnIdentifier(col) !== null,
    );

    if (filterableColumns.length === 0) {
      return [
        {
          key: "no-filterable-columns",
          label: t("tableSettings.noFilterableColumns"),
          disabled: true,
        },
      ];
    }

    const allSelected =
      filterableColumns.length > 0 &&
      filterableColumns.every((col) => {
        const identifier = getColumnIdentifier(col);
        return identifier !== null && visibleColumnKeys.includes(identifier);
      });
    const someSelected = filterableColumns.some((col) => {
      const identifier = getColumnIdentifier(col);
      return identifier !== null && visibleColumnKeys.includes(identifier);
    });

    const items: MenuProps["items"] = [
      {
        key: "select-all",
        label: (
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          >
            {t("tableSettings.selectAll")}
          </Checkbox>
        ),
      },
      {
        type: "divider",
      },
      ...filterableColumns
        .map((col) => {
          const identifier = getColumnIdentifier(col);
          if (!identifier) return null;

          const title = col.title as string;
          const isVisible = visibleColumnKeys.includes(identifier);

          return {
            key: `column-${identifier}`,
            label: (
              <Checkbox
                checked={isVisible}
                onChange={(e) => {
                  e.stopPropagation();
                  handleColumnVisibilityChange(identifier, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {title || identifier}
              </Checkbox>
            ),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    ];

    return items;
  };

  if (!columns || columns.length === 0) {
    return null;
  }

  return (
    <Dropdown
      menu={{ items: getColumnFilterMenuItems() }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Popover content={t("tableSettings.columnSettings")} trigger="hover">
        <Button icon={<SettingOutlined />} type="text"></Button>
      </Popover>
    </Dropdown>
  );
};

export default ColumnFilter;
