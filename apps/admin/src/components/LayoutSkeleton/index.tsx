import { Skeleton } from "antd";

/**
 * 首屏加载时的布局骨架，用于已登录用户在菜单加载完成前展示
 */
const LayoutSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton active paragraph={{ rows: 2 }} />
      <Skeleton active paragraph={{ rows: 4 }} />
      <Skeleton active paragraph={{ rows: 3 }} />
    </div>
  );
};

export default LayoutSkeleton;
