import PubSub from "pubsub-js";
import { useEffect, useRef } from "react";

interface UsePubSubListenerOptions {
  /** 订阅的事件名称 */
  name: string;
  /** 事件回调函数 */
  callback?: (data: unknown) => void;
  /** useEffect 的依赖数组 */
  deps?: React.DependencyList;
}

/**
 * PubSub 事件监听 Hook
 * @param options 配置选项
 */
export default function usePubSubListener({
  name,
  callback = (data: unknown) => {
    console.log(data);
  },
  deps = [],
}: UsePubSubListenerOptions): void {
  // 使用 ref 保存最新的 callback，避免依赖变化导致重复订阅
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    // 在 useEffect 内部进行条件检查
    if (!name || name.includes("undefined")) {
      return;
    }

    const token = PubSub.subscribe(name, (_, data: unknown) => {
      callbackRef.current(data);
    });
    return () => {
      if (token) {
        PubSub.unsubscribe(token);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, ...deps]);
}
