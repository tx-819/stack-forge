import { useEffect } from 'react';
import { Spin } from 'antd';
import type { FormInstance } from 'antd/es/form';
import useInitialValues from './_hooks/useInitialValues';

interface ExtendedFormInstance extends FormInstance {
  setInitialValues?: (newInitialValues?: Record<string, unknown>) => void;
}

interface ChildrenWrapperProps {
  initialValues?: Record<string, unknown>;
  requestInitialValues?: (props: {
    resolve: (values: Record<string, unknown>) => void;
    reject: () => void;
  }) => void;
  requestDeps?: unknown[];
  form?: FormInstance;
  children?: React.ReactNode;
}

function ChildrenWrapper(props: ChildrenWrapperProps) {
  const {
    loading,
    initialValues,
    form,
    children,
  } = useInitialValues(props);

  useEffect(() => {
    if (loading === false && form && (form as ExtendedFormInstance).setInitialValues) {
      setTimeout(() => {
        (form as ExtendedFormInstance).setInitialValues?.(initialValues);
      }, 0);
    }
  }, [loading, initialValues, form]);

  if (loading) {
    return <Spin />;
  }

  return <>{children}</>;
}

export default ChildrenWrapper;
