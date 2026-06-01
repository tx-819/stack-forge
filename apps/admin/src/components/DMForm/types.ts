import type { FormInstance, FormProps } from 'antd/es/form';
import type { ReactNode } from 'react';
import type { ModalProps } from 'antd/es/modal';
import type { DrawerProps } from 'antd/es/drawer';

export interface DMFormContextConfig {
  form: FormInstance;
  submit: (submitParams?: Record<string, unknown>) => Promise<void>;
  reset: (newInitialValues?: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

export interface DMFormRenderFooterProps {
  form: FormInstance;
  submit: (params?: Record<string, unknown>) => Promise<void>;
  reset: (newInitialValues?: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

export interface DMFormBeforeShowCloseProps {
  resolve: () => void;
  reject?: () => void;
}

export interface DMFormRunConfig {
  visible?: boolean;
  submit?: boolean;
  submitParams?: Record<string, unknown>;
  reset?: boolean;
  resetParams?: Record<string, unknown>;
}

export interface DMFormProps<T> extends Omit<FormProps, 'onFinish' | 'title'> {
  /** 表单名称 */
  name?: string;
  /** 表单实例 */
  form?: FormInstance;
  /** 子元素 */
  children?: ReactNode;
  /** 渲染子元素函数 */
  renderChildren?: (contextConfig: DMFormContextConfig) => ReactNode;
  /** 渲染底部函数 */
  renderFooter?: (contextConfig: DMFormContextConfig) => ReactNode;
  /** 弹窗类型 */
  type?: 'Modal' | 'Drawer';
  /** 触发元素 */
  trigger?: ReactNode | ((props: { onClick: (e: React.MouseEvent) => void }) => ReactNode);
  /** 显示前回调 */
  beforeShow?: (props: DMFormBeforeShowCloseProps) => void;
  /** 关闭前回调 */
  beforeClose?: (props: DMFormBeforeShowCloseProps) => void;
  /** 标题 */
  title?: ReactNode;
  /** 宽度 */
  width?: number | string;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** Modal/Drawer 配置 */
  dmConfig?: Partial<ModalProps> | Partial<DrawerProps>;
  /** 未保存警告 */
  unsavedWarning?: boolean;
  /** 初始值 */
  initialValues?: Partial<T>;
  /** 请求初始值函数 */
  requestInitialValues?: (props: { resolve: (values: Record<string, unknown>) => void; reject: () => void }) => void;
  /** 请求依赖 */
  requestDeps?: unknown[];
  /** 提交回调 */
  onSubmit?: (
    values: T,
    helpers: {
      success: (content?: string | null, options?: { initialValues?: Record<string, unknown> }) => void;
      error: (content?: string | null) => void;
      form: FormInstance;
    },
    submitParams?: Record<string, unknown>
  ) => void;
  /** 确认回调 */
  onOk?: (
    values: T,
    helpers: {
      success: (content?: string | null, options?: { initialValues?: Record<string, unknown> }) => void;
      error: (content?: string | null) => void;
      form: FormInstance;
    },
    submitParams?: Record<string, unknown>
  ) => void;
  /** 提交失败回调 */
  onFailed?: (errorInfo: {
    errorFields?: Array<{ name: string[] }>;
    outOfDate?: boolean;
    values?: Partial<T>;
  }) => void;
}

