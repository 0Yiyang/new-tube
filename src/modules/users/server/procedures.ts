import db from "@/db";
import { subscriptions, users, videos } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, getTableColumns, inArray, isNotNull } from "drizzle-orm";

import { z } from "zod";

export const usersRouter = createTRPCRouter({
  //得到一个用户的信息
  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx;
      let userId;
      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
      if (user) {
        userId = user.id;
      }

      // 我自己（观众）的所有订阅记录
      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select()
          .from(subscriptions)
          .where(inArray(subscriptions.viewerId, userId ? [userId] : []))
      );

      const [existingUser] = await db
        .with(viewerSubscriptions) //.with() 将其引入主查询中，使其可被引用。
        .select({
          ...getTableColumns(users),
          viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(
            Boolean
          ),
          videoCount: db.$count(videos, eq(videos.userId, users.id)),
          subscriberCount: db.$count(
            subscriptions,
            eq(subscriptions.creatorId, users.id)
          ),
        })
        .from(users)
        .leftJoin(
          viewerSubscriptions,
          eq(viewerSubscriptions.creatorId, users.id) //这里的users.id依赖于innerjoin的查询
        ) //viewerReaction 可能不存在（用户未登录或未互动），所以要用左连接。
        .where(eq(users.id, input.id))
        .limit(1)
        .groupBy(users.id, viewerSubscriptions.viewerId); //没有使用聚合函数的  有count
      // 先使用where筛选出目标视频，再子查询，
      if (!existingUser) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return existingUser;
    }),
  // TODO:workflow.trigger:触发远程的工作流执行。
  // 当用户请求生成视频标题时，后端并不直接处理，
  // 而是通过调用外部服务（如Upstash）来启动一个工作流，
  // 这可能涉及调用AI服务或其他耗时任务，从而异步处理请求
  // 返回的workflowRunId可以让客户端轮询或通过Webhook获取结果。
});
