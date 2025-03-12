import { useEffect, useRef, useState } from "react";

export const useIntersectionObserve = (options?: IntersectionObserverInit) => {
  // 1. 状态管理：记录目标元素是否进入视口
  const [isIntersecting, setIntersecting] = useState(false);

  // 2. 使用 useRef 创建一个引用，用于绑定目标元素
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 3. 创建一个 IntersectionObserver 实例
    const observer = new IntersectionObserver(([entry]) => {
      // 4. 当目标元素的可见状态发生变化时，更新状态
      setIntersecting(entry.isIntersecting);
    }, options);

    // 5. 开始观察目标元素
    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    // 6. 清理函数：组件卸载时停止观察
    return () => observer.disconnect();
  }, [options]);

  // 7. 返回目标元素的引用和交集状态
  return { targetRef, isIntersecting };
};
