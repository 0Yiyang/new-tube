import db from "@/db";
import {
  playlists,
  playlistVideos,
  users,
  videoReactions,
  videos,
  videoViews,
} from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

export const playlistsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id } = input;
      const [removedPlaylist] = await db
        .delete(playlists)
        .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
        .returning();

      if (!removedPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return removedPlaylist;
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id } = input;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return existingPlaylist;
    }),
  getVideos: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
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
      const { cursor, limit, playlistId } = input;
      const { id: userId } = ctx.user;
      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const videosFromPlaylist = db.$with("videos_from_playlists").as(
        db
          .select({
            videoId: playlistVideos.videoId,
          })
          .from(playlistVideos)
          .where(eq(playlistVideos.playlistId, playlistId))
      );

      const data = await db
        .with(videosFromPlaylist)
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
        .innerJoin(
          videosFromPlaylist,
          eq(videosFromPlaylist.videoId, videos.id)
        )
        .where(
          and(
            eq(videos.visibility, "public"),
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

  removeVideo: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        videoId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { playlistId, videoId } = input;
      const { id: userId } = ctx.user;
      // playlist是由有效
      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      // video是否有效
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));
      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      //
      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId)
          )
        );
      if (!existingPlaylistVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [removedPlaylistVideo] = await db
        .delete(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId)
          )
        )
        .returning();
      return removedPlaylistVideo;
    }),

  addVideo: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        videoId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { playlistId, videoId } = input;
      const { id: userId } = ctx.user;
      // playlist是由有效
      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      // video是否有效
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));
      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      //
      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId)
          )
        );
      if (existingPlaylistVideo) {
        throw new TRPCError({ code: "CONFLICT" });
      }

      const [createdPlaylistVideo] = await db
        .insert(playlistVideos)
        .values({
          videoId,
          playlistId,
        })
        .returning();
      return createdPlaylistVideo;
    }),

  getManyForVideo: protectedProcedure
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
    .query(async ({ input, ctx }) => {
      const { cursor, limit, videoId } = input;
      const { id: userId } = ctx.user;
      // TODO:如果需要返回所有播放列表并标记是否包含视频 → 用版本2
      // // 从playlistVideos里面找videoID相同的-》playlistID

      // 即临时表，存储了 所有包含目标视频（videoId）的播放列表 ID：,,如果某个播放列表 包含目标视频，则它的 playlistId 会出现在这个临时表中。
      const videoPlaylists = db
        .$with("video_playlists")
        .as(
          db
            .select({ playlistId: playlistVideos.playlistId })
            .from(playlistVideos)
            .where(eq(playlistVideos.videoId, videoId))
        );
      // // 根据playlistId-》是user创建的

      const data = await db
        .with(videoPlaylists)
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistVideos,
            eq(playlistVideos.playlistId, playlists.id)
          ),
          user: users,
          containsVideo: sql<boolean>`(${videoPlaylists.playlistId} IS NOT NULL)`, //如果需要返回所有播放列表并标记是否包含视频
          // containsVideo: videoId
          //   ? sql<boolean>`(
          //   SELECT EXISTS(
          //     SELECT 1
          //     FROM ${playlistVideos} pv
          //     WHERE pv.playlist_id = ${playlists.id} AND pv.video_id =${videoId}
          //   ))`
          //   : sql<boolean>`false`,
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .leftJoin(videoPlaylists, eq(videoPlaylists.playlistId, playlists.id))
        //如果关联成功（playlists包含目标视频）： videoPlaylists.playlistId 会有值
        // .innerJoin(videoPlaylists, eq(videoPlaylists.playlistId, playlists.id))->只返回包含 videoId 的播放列表
        .where(
          and(
            eq(playlists.userId, userId),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id)
                  )
                )
              : undefined
          )
        )

        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
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
  getMany: protectedProcedure
    .input(
      z.object({
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
      const { cursor, limit } = input;
      const { id: userId } = ctx.user;
      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistVideos,
            eq(playlistVideos.playlistId, playlists.id)
          ),
          user: users,
          // TODO:sql语法
          thumbnailUrl: sql<string | null>`(
            -- 从 playlistVideos表中，找到属于当前playlists的所有playlistVideos。
            -- 关联 videos 表，获取视频的缩略图 URL（v.thumbnail_url）。
          -- 按 pv.updated_at DESC 排序，取最新添加的视频的缩略图（LIMIT 1）。
            SELECT v.thumbnail_url
            FROM ${playlistVideos} pv
            JOIN ${videos} v ON v.id =pv.video_id
            WHERE pv.playlist_id=${playlists.id}
            ORDER BY pv.updated_at desc
            LIMIT 1
          )`,
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(
          and(
            eq(playlists.userId, userId),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id)
                  )
                )
              : undefined
          )
        )

        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
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

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name } = input;
      const { id: userId } = ctx.user;
      const [createdplaylist] = await db
        .insert(playlists)
        .values({
          userId,
          name,
        })
        .returning();
      if (!createdplaylist) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      return createdplaylist;
    }),
  getLiked: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            likedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit } = input;
      const { id: userId } = ctx.user;

      const viewerVideoReactions = db.$with("viewer_video_reactions").as(
        db
          .select({
            videoId: videoReactions.videoId,
            likedAt: videoReactions.updatedAt,
          })
          .from(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),
              eq(videoReactions.type, "like")
            )
          )
      );
      const data = await db
        .with(viewerVideoReactions)
        .select({
          ...getTableColumns(videos),
          user: users,
          likedAt: viewerVideoReactions.likedAt,
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
        .innerJoin(
          viewerVideoReactions,
          eq(viewerVideoReactions.videoId, videos.id)
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            cursor
              ? or(
                  lt(viewerVideoReactions.likedAt, cursor.likedAt),
                  and(
                    eq(viewerVideoReactions.likedAt, cursor.likedAt),
                    lt(videos.id, cursor.id)
                  )
                )
              : undefined
          )
        )

        .orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))
        // 多取一个，看看还有没有剩余的
        .limit(limit + 1);
      const hasMore = data.length > limit;
      // 如果还有更多，就删除最后一项，下一次获取Cursor就从最后一项开始
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            likedAt: lastItem.likedAt,
          }
        : null;
      return {
        items,
        nextCursor,
      };
    }),
  getHistory: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            viewedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit } = input;
      const { id: userId } = ctx.user;
      const viewerVideoViews = db.$with("viewer_video_views").as(
        db
          .select({
            viewedAt: videoViews.updatedAt,
            videoId: videoViews.videoId,
          })
          .from(videoViews)
          .where(eq(videoViews.userId, userId))
      );
      const data = await db
        .with(viewerVideoViews)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewedAt: viewerVideoViews.viewedAt,
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
        .innerJoin(viewerVideoViews, eq(viewerVideoViews.videoId, videos.id))
        .where(
          and(
            eq(videos.visibility, "public"),
            cursor
              ? or(
                  lt(viewerVideoViews.viewedAt, cursor.viewedAt),
                  and(
                    eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                    lt(videos.id, cursor.id)
                  )
                )
              : undefined
          )
        )

        .orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
        // 多取一个，看看还有没有剩余的
        .limit(limit + 1);
      const hasMore = data.length > limit;
      // 如果还有更多，就删除最后一项，下一次获取Cursor就从最后一项开始
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            viewedAt: lastItem.viewedAt,
          }
        : null;
      return {
        items,
        nextCursor,
      };
    }),
});
