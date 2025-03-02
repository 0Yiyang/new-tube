"use client";

import { trpc } from "@/trpc/client";

export const PageClient = () => {
  //useSuspenseQuery：这是一个 React Query 的 Suspense 模式钩子，
  // 用于在客户端查询数据。 会尝试从 tRPC 的缓存中获取数据，如果缓存中没有数据，则会发起网络请求。
  // 在利用服务器组件的速度，useQuery比较慢,,
  // TODO:实际上没有用到prefetch里面的text.这里有个小问题
  // ，但你必须要prefetch.配合useSuspenseX,
  // 如果在认证的时候没有写prefetch,就会有问题
  const [data] = trpc.hello.useSuspenseQuery({
    text: "poplar",
  });
  return <div>Page Client: {data.greeting}</div>;
};
