import { studioRouter } from "@/modules/studio/server/procedures";
import { createTRPCRouter } from "../init";
import { categoriesRouter } from "@/modules/categories/server/procedures";
import { videosRouter } from "@/modules/videos/server/procedures";
import { videoViewsRouter } from "@/modules/video-views/server/procedures";
import { videoReactionsRouter } from "@/modules/video-reactions/server/procedures";
import { subscriptionsRouter } from "@/modules/subscriptions/server/procedures";
import { commentsRouter } from "@/modules/comments/server/procedures";
import { commentReactionsRouter } from "@/modules/comment-reactions/server/procedures";
import { suggestionsRouter } from "@/modules/suggestions/server/procedures";
import { searchRouter } from "@/modules/search/server/procedure";
import { playlistsRouter } from "@/modules/playlists/server/procedures";

// 创建 tRPC 路由。
// - 将多个 tRPC 过程组织在一起。(把router集合)
// - 提供类型安全的 API 端点。
export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  videos: videosRouter,
  studio: studioRouter,
  comments: commentsRouter,
  subscriptions: subscriptionsRouter,
  videoViews: videoViewsRouter,
  videoReactions: videoReactionsRouter,
  commentReactions: commentReactionsRouter,
  suggestions: suggestionsRouter,
  search: searchRouter,
  playlists: playlistsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
