import { useState } from "react";
import type { FormInstance } from "antd/es/form";

interface UseSearchFormActionsProps {
  form: FormInstance;
  onSearch?: (values: Record<string, unknown>) => void | Promise<void>;
  onReset?: () => void | Promise<void>;
}

/**
 * 处理搜索表单操作的 Hook
 * 包括：搜索、重置操作
 */
const useSearchFormActions = ({
  form,
  onSearch,
  onReset,
}: UseSearchFormActionsProps) => {
  const [searchLoading, setSearchLoading] = useState(false);

  // 处理搜索
  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      setSearchLoading(true);
      await onSearch?.(values);
    } finally {
      setSearchLoading(false);
    }
  };

  // 处理重置
  const handleReset = async () => {
    // 重置表单字段
    form.resetFields();
    // 调用外部的重置回调（来自 ProTable）
    await onReset?.();
  };

  return {
    searchLoading,
    handleSearch,
    handleReset,
  };
};

export default useSearchFormActions;

