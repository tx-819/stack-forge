import type { ReactNode, CSSProperties } from "react";
import { createElement } from "react";
import { getIconComponent, getRegisteredIconNames } from "./iconRegistry";

// 图标配置接口
export interface IconProps {
  size?: number | string; // 图标大小，可以是数字（像素）或字符串（如 "1rem"）
  color?: string; // 图标颜色
  strokeWidth?: number; // 描边宽度
  className?: string; // 自定义类名
  style?: CSSProperties; // 自定义样式
}

// 根据图标名称渲染图标组件（仅支持 iconRegistry 中注册的 lucide 图标）
export const getIcon = (
  iconName?: string,
  props?: IconProps
): ReactNode | undefined => {
  if (!iconName) return undefined;

  try {
    const IconComponent = getIconComponent(iconName);

    if (!IconComponent) {
      if (import.meta.env.DEV) {
        const available = getRegisteredIconNames().slice(0, 20).join(", ");
        console.warn(
          `Icon "${iconName}" not found. Add it to iconRegistry.tsx or use one of: ${available}...`
        );
      }
      return undefined;
    }

    // 构建图标属性
    const iconProps: Record<string, unknown> = {};

    if (props?.size !== undefined) {
      iconProps.size = props.size;
    }

    if (props?.color !== undefined) {
      iconProps.color = props.color;
    }

    if (props?.strokeWidth !== undefined) {
      iconProps.strokeWidth = props.strokeWidth;
    }

    if (props?.className !== undefined) {
      iconProps.className = props.className;
    }

    if (props?.style !== undefined) {
      iconProps.style = props.style;
    }

    return createElement(IconComponent, iconProps);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error creating icon "${iconName}":`, error);
    }
    return undefined;
  }
};
