// "use client";
// import { trpc } from "@/trpc/client";
// export default function Home() {
//   const { data } = trpc.hello.useQuery({ text: "poplar" });
//   return <div>client component says:{data?.greeting} </div>;
// }
// 服务器端，比客户端快，但是没有交互：速度换交互
// import { trpc } from "@/trpc/server";
// export default async function Home() {
//   const data = await trpc.hello({ text: "poplar" });
//   console.log(" where render");
//   return <div>server component says:{data.greeting} </div>;
// }

// import { HydrateClient, trpc } from "@/trpc/server";
// import { Suspense } from "react";
// import { ErrorBoundary } from "react-error-boundary";
// export default async function Home() {
//   // 在服务器端预取数据并将其缓存。预取的数据会被存储在 tRPC 的缓存中，供客户端组件使用。
//   //  这里使用 void 是因为你不需要等待预取操作完成，而是希望它异步执行，同时继续渲染页面。
//   //  使用 void 是为了避免阻塞页面渲染，但你需要确保预取操作在客户端组件渲染之前完成。
//   // 允许客户端组件使用基本上已经加载的数据
//   void trpc.categories.getmany.prefetch();
//   return (
//     <>
//       <HydrateClient>
//         <Suspense fallback={<p>Loading</p>}>
//           <ErrorBoundary fallback={<p>error..</p>}>
//             <PageClient />
//           </ErrorBoundary>
//         </Suspense>
//       </HydrateClient>
//     </>
//   );
// }

import { HomeView } from "@/modules/home/ui/views/home-view";
import { HydrateClient, trpc } from "@/trpc/server";
export const dynamic = "force-dynamic";
// force-dynamic是啥:
// 禁止静态渲染和缓存
// 强制把一个页面或路由都动态渲染;
// 动态导入，await searchParams，void trpc.categories.getmany.prefetch();都是动态获取的
interface PageProps {
  searchParams: Promise<{ categoryId?: string }>;
}
const Page = async ({ searchParams }: PageProps) => {
  const { categoryId } = await searchParams;
  // 动态预取TRPC数据
  void trpc.categories.getmany.prefetch();
  return (
    // 客户端渲染时，把预取数据注入
    <HydrateClient>
      <HomeView categoryId={categoryId} />
    </HydrateClient>
  );
};
export default Page;
