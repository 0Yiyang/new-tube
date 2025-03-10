import { studioRouter } from "@/modules/studio/server/procedures";
import { createTRPCRouter } from "../init";
import { categoriesRouter } from "@/modules/categories/server/procedures";
import { videosRouter } from "@/modules/videos/server/procedures";

// 创建 tRPC 路由。
// - 将多个 tRPC 过程组织在一起。(把router集合)
// - 提供类型安全的 API 端点。
export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  videos: videosRouter,
  studio: studioRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
