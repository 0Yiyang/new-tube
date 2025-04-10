import db from "@/db";
import { z } from "zod";
import { eq, and, or, lt, desc, getTableColumns } from "drizzle-orm";
import { users, videoReactions, videos, videoViews } from "@/db/schema";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

// query：用于获取数据，不会修改数据库。
// mutation：用于修改数据（如插入、更新、删除）。
export const suggestionsRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        cursor: z
          .object({
            id: z.string().uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { videoId, cursor, limit } = input;
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));
      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videos.id, videoViews.videoId)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videos.id, videoReactions.videoId),
              eq(videoReactions.type, "like")
            )
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videos.id, videoReactions.videoId),
              eq(videoReactions.type, "dislike")
            )
          ),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(
          and(
            // inArray(videos.categoryId,existingVideo.categoryId?[existingVideo.categoryId]:[]),下面更加直接，在没有existingVideo。categoryId，就不生成eq语句
            existingVideo.categoryId
              ? eq(videos.categoryId, existingVideo.categoryId)
              : undefined,

            cursor
              ? or(
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
