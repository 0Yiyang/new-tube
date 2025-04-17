import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type UserGetOntOutput = inferRouterOutputs<AppRouter>["users"]["getOne"];
