import db from "@/db";
import { videoReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const videoReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const videoId = input.videoId;
      const [existingVideoReactionLike] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.type, "like")
          )
        );

      // 如果我们已经喜欢过这个视频，再次点击喜欢，触发过一次这个端点，就把它当作切换开关，删除记录
      if (existingVideoReactionLike) {
        const [delectedViewerReactions] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),
              eq(videoReactions.videoId, videoId)
            )
          )
          .returning();
        return delectedViewerReactions;
      }

      const [createdVideoReaction] = await db
        .insert(videoReactions)
        .values({
          videoId,
          userId,
          type: "like",
        })
        // 如果我想从不喜欢-》喜欢,找到该组合键，update.如果组合键有冲突
        .onConflictDoUpdate({
          target: [videoReactions.videoId, videoReactions.userId],
          set: {
            type: "like",
          },
        })
        .returning();
      return createdVideoReaction;
    }),
  // 这是一个被保护的过程
  dislike: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const videoId = input.videoId;
      const [existingVideoReactionDislike] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.type, "dislike")
          )
        );

      // 如果我们已经喜欢过这个视频，再次点击喜欢，触发过一次这个端点，就把它当作切换开关，删除记录
      if (existingVideoReactionDislike) {
        const [delectedViewerReactions] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),
              eq(videoReactions.videoId, videoId)
            )
          )
          .returning();
        return delectedViewerReactions;
      }

      const [createdVideoReaction] = await db
        .insert(videoReactions)
        .values({
          videoId,
          userId,
          type: "dislike",
        })
        // 如果我想从不喜欢-》喜欢,找到该组合键，update.如果组合键有冲突
        .onConflictDoUpdate({
          target: [videoReactions.videoId, videoReactions.userId],
          set: {
            type: "dislike",
          },
        })
        .returning();
      return createdVideoReaction;
    }),
});
