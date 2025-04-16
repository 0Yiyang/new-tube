import db from "@/db";
import { z } from "zod";
import { eq, and, or, lt, desc, getTableColumns } from "drizzle-orm";
import {
  comments,
  users,
  videoReactions,
  videos,
  videoViews,
} from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

// query：用于获取数据，不会修改数据库。
// mutation：用于修改数据（如插入、更新、删除）。
export const studioRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id } = input;
      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, id), eq(videos.userId, userId)));
      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return video;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            // TODO:为什么是这样,这个参数怎么传进去
            id: z.string().uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        // TODO:这是干啥limit，-》
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;
      const { id: userID } = ctx.user;
      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like")
            )
          ),
          commentCount: db.$count(comments, eq(comments.videoId, videos.id)),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(
          and(
            // TODO:看不懂
            eq(videos.userId, userID),
            cursor
              ? or(
                  // TODO:排序不懂，
                  lt(videos.updatedAt, cursor.updatedAt),
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),
                    lt(videos.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        // 多取一个，看看还有没有剩余的
        .limit(limit + 1);
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
      };
    }),
});
