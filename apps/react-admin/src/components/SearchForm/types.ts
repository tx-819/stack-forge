import type { FormProps, FormInstance } from "antd/es/form";
import type { FormItemProps } from "antd/es/form";
import type { ReactNode } from "react";

/** 表单项类型 */
export type SearchFormItemType =
  | "input"
  | "password"
  | "textarea"
  | "number"
  | "select"
  | "datePicker"
  | "dateRangePicker"
  | "timePicker"
  | "switch"
  | "checkbox"
  | "radio"
  | "upload"
  | "custom";

/** 表单项配置 */
export interface SearchFormItemConfig extends FormItemProps {
  /** 表单项类型 */
  type?: SearchFormItemType;
  /** 输入组件额外属性 */
  fieldProps?: Record<string, unknown>;
  /** 自定义渲染函数 */
  render?: (form: FormInstance) => ReactNode;
  /** Select/Radio/Checkbox 的选项 */
  options?: Array<{ label: string; value: unknown; disabled?: boolean }>;
  /** 是否隐藏 */
  hidden?: boolean;
}

/** SearchForm 配置选项 */
export interface SearchFormOptions {
  /** 是否显示搜索按钮 */
  showSearchButton?: boolean;
  /** 搜索按钮文本 */
  searchText?: string;
  /** 是否显示重置按钮 */
  showResetButton?: boolean;
  /** 重置按钮文本 */
  resetText?: string;
  /** 是否支持折叠/展开（当表单项超过默认显示数量时） */
  showCollapseButton?: boolean;
  /** 默认是否折叠 */
  defaultCollapsed?: boolean;
  /** 默认展开时显示的表单项数量 */
  defaultShowItems?: number;
}

/** SearchForm 属性 */
export interface SearchFormProps extends Omit<
  FormProps,
  "layout" | "onFinish"
> {
  /** 表单项配置数组 */
  items: SearchFormItemConfig[];
  /** 搜索表单选项配置 */
  options?: SearchFormOptions;
  /** 搜索回调 */
  onSearch?: (values: Record<string, unknown>) => void | Promise<void>;
  /** 重置回调 */
  onReset?: () => void | Promise<void>;
}

/** SearchForm 引用方法 */
export interface SearchFormRef extends FormInstance {
  /** 搜索 */
  onSearch: () => Promise<void>;
  /** 重置 */
  onReset: () => Promise<void>;
}
