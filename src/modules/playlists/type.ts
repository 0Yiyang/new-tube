import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";
export type PlayListGetManyOutPut =
  inferRouterOutputs<AppRouter>["playlists"]["getMany"];
