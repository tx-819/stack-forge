import { useEffect } from "react";
import NProgress from "nprogress";

// 配置 NProgress
NProgress.configure({
  showSpinner: false, // 不显示旋转器
  trickleSpeed: 200, // 进度条速度
  minimum: 0.08, // 最小进度值
});

const NProgressFallback = () => {
  useEffect(() => {
    // 确保每次显示时都重新开始
    NProgress.start();
    // 使用 setTimeout 确保进度条能显示出来（即使组件加载很快）
    const timer = setTimeout(() => {
      NProgress.set(0.3); // 设置初始进度
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, []);

  return null;
};

export default NProgressFallback;
