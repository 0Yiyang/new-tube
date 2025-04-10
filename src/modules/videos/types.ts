import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

// 获得路由返回值的类型
export type VideoGetOneOutput =
  inferRouterOutputs<AppRouter>["videos"]["getOne"];
// TODO:后面改videos
export type VideoGetManyOutput =
  inferRouterOutputs<AppRouter>["suggestions"]["getMany"];
