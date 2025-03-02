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
import { HydrateClient, trpc } from "@/trpc/server";
import { PageClient } from "./client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
export default async function Home() {
  // 在服务器端预取数据并将其缓存。预取的数据会被存储在 tRPC 的缓存中，供客户端组件使用。
  //  这里使用 void 是因为你不需要等待预取操作完成，而是希望它异步执行，同时继续渲染页面。
  //  使用 void 是为了避免阻塞页面渲染，但你需要确保预取操作在客户端组件渲染之前完成。
  void trpc.hello.prefetch({ text: "poplar" });
  // console.log(" where render");
  // 允许客户端组件使用基本上已经加载的数据
  return (
    <>
      <HydrateClient>
        <Suspense fallback={<p>Loading</p>}>
          <ErrorBoundary fallback={<p>error..</p>}>
            <PageClient />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
}
