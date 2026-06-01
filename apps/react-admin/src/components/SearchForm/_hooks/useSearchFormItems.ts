import { useMemo, useState } from "react";
import type { SearchFormItemConfig } from "../types";
import type { SearchFormOptions } from "../types";

/**
 * 处理搜索表单项的 Hook
 * 包括：过滤隐藏项、添加默认配置、处理折叠逻辑
 */
const useSearchFormItems = (
  items: SearchFormItemConfig[],
  options: Required<SearchFormOptions>
) => {
  const [collapsed, setCollapsed] = useState(options.defaultCollapsed);

  // 过滤掉隐藏的表单项
  const visibleItems = useMemo(
    () => items.filter((item) => !item.hidden),
    [items]
  );

  // 处理表单项，为搜索场景添加默认配置
  const processedItems = useMemo(() => {
    return items.map((item) => {
      const processedItem: SearchFormItemConfig = { ...item };

      // 为搜索场景的组件添加 allowClear 默认配置
      if (
        (item.type === "select" ||
          item.type === "datePicker" ||
          item.type === "dateRangePicker" ||
          item.type === "timePicker") &&
        !item.fieldProps?.allowClear &&
        item.fieldProps?.allowClear !== false
      ) {
        processedItem.fieldProps = {
          ...item.fieldProps,
          allowClear: true,
        };
      }

      return processedItem;
    });
  }, [items]);

  // 计算需要显示的表单项
  const displayItems = useMemo(() => {
    const defaultShowItems = options.defaultShowItems;
    if (
      !options.showCollapseButton ||
      visibleItems.length <= defaultShowItems
    ) {
      return processedItems;
    }
    const visibleProcessedItems = processedItems.filter((item) => !item.hidden);
    return collapsed
      ? visibleProcessedItems.slice(0, defaultShowItems)
      : visibleProcessedItems;
  }, [
    options.showCollapseButton,
    options.defaultShowItems,
    visibleItems.length,
    processedItems,
    collapsed,
  ]);

  // 是否需要显示展开/收起按钮
  const showCollapseButton =
    options.showCollapseButton &&
    visibleItems.length > options.defaultShowItems;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return {
    displayItems,
    showCollapseButton,
    collapsed,
    toggleCollapse,
  };
};

export default useSearchFormItems;

