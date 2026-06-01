import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SearchFormOptions } from "../types";

/**
 * 处理搜索表单选项配置的 Hook
 * 合并默认配置和用户配置
 */
const useSearchFormOptions = (options?: SearchFormOptions) => {
  const { t } = useTranslation();

  const searchOptions: Required<SearchFormOptions> = useMemo(() => {
    const defaultOptions = {
      showSearchButton: true,
      searchText: t("search"),
      showResetButton: true,
      resetText: t("reset"),
      showCollapseButton: true,
      defaultCollapsed: true,
      defaultShowItems: 2,
    };

    return {
      ...defaultOptions,
      ...options,
    } as Required<SearchFormOptions>;
  }, [options, t]);

  return searchOptions;
};

export default useSearchFormOptions;
