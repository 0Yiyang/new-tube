import db from "@/db";
import { commentReactions, comments, users } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
} from "drizzle-orm";
import { z } from "zod";

export const commentsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id } = input;
      const [deletedcomment] = await db
        .delete(comments)
        .where(and(eq(comments.id, id), eq(comments.userId, userId)))
        // TODO:一定要有这个，确保是本人删除
        .returning();
      if (!deletedcomment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return deletedcomment;
    }),

  create: protectedProcedure
    .input(
      z.object({
        parentId: z.string().uuid().nullish(),
        value: z.string(),
        videoId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { videoId, value, parentId } = input;
      const [existingComment] = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, parentId ? [parentId] : []));
      if (!existingComment && parentId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      //不可以给reply reply
      if (existingComment?.parentId && parentId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const [createdcomment] = await db
        .insert(comments)
        .values({
          parentId,
          value,
          userId,
          videoId,
        })
        .returning();

      return createdcomment;
    }),
  // 只加载comment,也可以选择加载reply
  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        parentId: z.string().uuid().nullish(),
        cursor: z
          .object({
            id: z.string().uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { videoId, cursor, limit, parentId } = input;
      const { clerkUserId } = ctx;

      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
      if (user) {
        userId = user.id;
      }
      const viewerReactions = db.$with("viewer_reactions").as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, userId ? [userId] : []))
      );
      // 加上去，再执行这个声明
      const replies = db.$with("replies").as(
        db
          .select({
            parentId: comments.parentId,
            count: count(comments.id).as("count"), // 计算每个 parentId 的reply（comments.id） 的数量
          })
          .from(comments)
          .where(isNotNull(comments.parentId)) // 只统计回复（有 parentId 的评论）
          .groupBy(comments.parentId) // 按 parentId 分组
      );

      const [totalData, data] = await Promise.all([
        db
          .select({
            count: count(),
          })
          .from(comments)
          .where(eq(comments.videoId, videoId)),

        db
          .with(viewerReactions, replies)
          .select({
            user: users,
            replyCount: replies.count,
            likeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, "like"),
                eq(commentReactions.commentId, comments.id)
              )
            ),
            dislikeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, "dislike"),
                eq(commentReactions.commentId, comments.id)
              )
            ),
            viewerReaction: viewerReactions.type,
            ...getTableColumns(comments),
          })
          .from(comments)
          .where(
            and(
              eq(comments.videoId, videoId),
              parentId
                ? eq(comments.parentId, parentId) //加载replies（指定comment）
                : isNull(comments.parentId), //筛选出来没有parentId的
              cursor
                ? or(
                    // TODO:排序不懂，
                    lt(comments.updatedAt, cursor.updatedAt),
                    and(
                      eq(comments.updatedAt, cursor.updatedAt),
                      lt(comments.id, cursor.id)
                    )
                  )
                : undefined
            )
          )
          .innerJoin(users, eq(comments.userId, users.id))
          .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId)) //有没有匹配的，也就是没有reply.replies.count 会是 NULL（因为用了 leftJoin）
          .leftJoin(replies, eq(comments.id, replies.parentId)) //comments.id,这个里面执行过后的comments表，
          .orderBy(desc(comments.updatedAt), desc(comments.id))
          .limit(limit + 1)
          .groupBy(users.id, viewerReactions.type, comments.id, replies.count),
      ]);

      const hasMore = data.length > limit;
      // 如果还有更多，就删除最后一项，下一次获取Cursor就从最后一项开始
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
          }
        : null;
      return {
        items,
        nextCursor,
        totalCount: totalData[0].count,
      };
    }),
});
