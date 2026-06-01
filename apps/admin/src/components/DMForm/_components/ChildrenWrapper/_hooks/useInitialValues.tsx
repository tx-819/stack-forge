import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { FormInstance } from 'antd/es/form';

interface UseInitialValuesProps {
  initialValues?: Record<string, unknown>;
  requestInitialValues?: (props: {
    resolve: (values: Record<string, unknown>) => void;
    reject: () => void;
  }) => void;
  requestDeps?: unknown[];
  form?: FormInstance;
  children?: React.ReactNode;
}

interface NormalizedProps {
  loading: boolean;
  initialValues?: Record<string, unknown>;
  form?: FormInstance;
  children?: React.ReactNode;
}

function useInitialValues(props: UseInitialValuesProps): NormalizedProps {
  const {
    initialValues: providedInitialValues,
    requestInitialValues = ({ resolve }: { resolve: (values: Record<string, unknown>) => void }) => {
      resolve({});
    },
    requestDeps = [],
    ...rest
  } = props;

  // 将 requestDeps 转换为 queryKey，使用 useMemo 确保依赖正确
  const queryKey = useMemo(
    () => ['DMFormInitialValues', ...requestDeps],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    requestDeps
  );

  // 如果直接提供了 initialValues，不需要查询
  const shouldQuery = !('initialValues' in props) || providedInitialValues === undefined;

  // 使用 useQuery 替代 useRequest
  const { isLoading, data: queriedInitialValues } = useQuery<Record<string, unknown>>({
    queryKey,
    queryFn: () => {
      return new Promise<Record<string, unknown>>((resolve, reject) => {
        requestInitialValues({
          resolve: (values) => resolve(values),
          reject: () => reject(new Error('Failed to load initial values')),
        });
      });
    },
    enabled: shouldQuery, // 只有在需要查询时才启用
    staleTime: 0, // 每次依赖变化时都重新获取
  });

  // 确定使用哪个 initialValues
  const initialValues = providedInitialValues ?? queriedInitialValues;
  const loading = shouldQuery ? isLoading : false;

  return {
    loading,
    initialValues,
    ...rest,
  };
}

export default useInitialValues;
