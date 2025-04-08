import db from "@/db";
import { commentReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const commentReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const commentId = input.commentId;
      const [existingCommentReactionLike] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.userId, userId),
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.type, "like")
          )
        );

      // 如果我们已经喜欢过这个视频，再次点击喜欢，触发过一次这个端点，就把它当作切换开关，删除记录
      if (existingCommentReactionLike) {
        const [delectedViewerReactions] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.userId, userId),
              eq(commentReactions.commentId, commentId)
            )
          )
          .returning();
        return delectedViewerReactions;
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({
          commentId,
          userId,
          type: "like",
        })
        // 如果我想从不喜欢-》喜欢,找到该组合键，update.如果组合键有冲突
        .onConflictDoUpdate({
          target: [commentReactions.commentId, commentReactions.userId],
          set: {
            type: "like",
          },
        })
        .returning();
      return createdCommentReaction;
    }),
  // 这是一个被保护的过程
  dislike: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const commentId = input.commentId;
      const [existingCommentReactionDislike] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.userId, userId),
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.type, "dislike")
          )
        );

      // 如果我们已经喜欢过这个视频，再次点击喜欢，触发过一次这个端点，就把它当作切换开关，删除记录
      if (existingCommentReactionDislike) {
        const [delectedViewerReactions] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.userId, userId),
              eq(commentReactions.commentId, commentId)
            )
          )
          .returning();
        return delectedViewerReactions;
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({
          commentId,
          userId,
          type: "dislike",
        })
        // 如果我想从不喜欢-》喜欢,找到该组合键，update.如果组合键有冲突
        .onConflictDoUpdate({
          target: [commentReactions.commentId, commentReactions.userId],
          set: {
            type: "dislike",
          },
        })
        .returning();
      return createdCommentReaction;
    }),
});
