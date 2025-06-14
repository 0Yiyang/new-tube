import db from "@/db";
import { users } from "@/db/schema";
import { ratelimit } from "@/lib/ratelimit";
import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import superjson from "superjson";
// 定义Context类型，createTRPCContext()在每次调用 tRPC 时都会被调用，因此批处理请求将共享一个context。
export const createTRPCContext = cache(async () => {
  const { userId } = await auth();
  return { clerkUserId: userId };
});
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

// 受保护的 tRPC 过程
// - 确保只有已登录的用户可以访问该过程。
// - 在上下文中注入用户信息（通过 `opts.ctx.user`）
export const protectedProcedure = t.procedure.use(async function isAuthed(
  opts
) {
  const { ctx } = opts;
  // 使用Clerk登录
  if (!ctx.clerkUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  // db里有没有记录
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, ctx.clerkUserId))
    .limit(1);
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  // 限制请求频率,凭借user.id
  const { success } = await ratelimit.limit(user.id);
  if (!success) {
    console.log("TOO_MANY_REQUESTS");
    // throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }
  // 将用户信息注入上下文
  return opts.next({
    ctx: {
      ...ctx,
      user,
    },
  });
});
