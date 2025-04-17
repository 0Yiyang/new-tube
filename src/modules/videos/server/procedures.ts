import db from "@/db";
import {
  subscriptions,
  users,
  videoReactions,
  videos,
  videoUpdateSchema,
  videoViews,
} from "@/db/schema";
import { mux } from "@/lib/mux";
import { workflow } from "@/lib/workflow";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  and,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  lt,
  or,
} from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

export const videosRouter = createTRPCRouter({
  getManySubscribed: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().nullish(),
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
      const { cursor, limit, categoryId } = input;
      const { id: userId } = ctx.user;

      const viewerSubscriptoins = db.$with("viewer_subscriptions").as(
        db
          .select({
            userId: subscriptions.creatorId,
          })
          .from(subscriptions)
          .where(eq(subscriptions.viewerId, userId))
      );
      // TODO:不写成inArray,在protectedProcedure，userId一定存在
      const data = await db
        .with(viewerSubscriptoins)
        // TODO:必须在查询中先通过 WITH 定义 CTE，才能用 join 或 from 引用它。
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
          viewerSubscriptoins,
          eq(viewerSubscriptoins.userId, users.id)
        )
        // 内连接（只返回匹配的记录）	严格只返回 用户订阅的创作者 的视频
        //TODO:如果是 左连接（返回videos所有记录，右表无匹配则为 NULL
        .where(
          and(
            eq(videos.visibility, "public"),
            categoryId ? eq(videos.categoryId, categoryId) : undefined,
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

  getManyTrending: baseProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            viewCount: z.number(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit } = input;
      const viewCountSubquery = db.$count(
        videoViews,
        eq(videoViews.videoId, videos.id)
      );
      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: viewCountSubquery,
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
            eq(videos.visibility, "public"),

            cursor
              ? or(
                  lt(viewCountSubquery, cursor.viewCount),
                  and(
                    eq(viewCountSubquery, cursor.viewCount),
                    lt(videos.id, cursor.id)
                  )
                )
              : undefined
          )
        )

        .orderBy(desc(viewCountSubquery), desc(videos.id))
        // 多取一个，看看还有没有剩余的
        .limit(limit + 1);
      const hasMore = data.length > limit;
      // 如果还有更多，就删除最后一项，下一次获取Cursor就从最后一项开始
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            viewCount: lastItem.viewCount,
          }
        : null;
      return {
        items,
        nextCursor,
      };
    }),

  getMany: baseProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().nullish(),
        userId: z.string().uuid().nullish(),
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
      const { cursor, limit, categoryId, userId } = input;
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
            eq(videos.visibility, "public"),
            categoryId ? eq(videos.categoryId, categoryId) : undefined,
            userId ? eq(videos.userId, userId) : undefined,
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

  // 公共表
  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // 获取某一个video的详细资料,innerJoin,users

      const { clerkUserId } = ctx;
      let userId;
      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
      // inArray在一个列里面找数组里的值   inArray 是为了在 ClerkUserId 为空时静默返回空结
      //TODO:有值才查询，无值则忽略  inArray(column, values): WHERE users.clerk_id IN ('user-123')  -
      //  lerkUserId 存在时：转换为 users.clerkId IN ('user-123')（精确匹配）。
      // ClerkUserId 为 null/undefined 时：转换为 users.clerkId IN ()（空数组），数据库会直接返回空结果。
      if (user) {
        userId = user.id;
      }
      // 预先定义一个临时表（此处为 viewer_reaction），供后续查询引用。预先制表并查询
      const viewerReactions = db.$with("viewer_reaction").as(
        db
          .select({
            videoId: videoReactions.videoId,
            type: videoReactions.type,
          })
          .from(videoReactions)
          .where(inArray(videoReactions.userId, userId ? [userId] : []))
        // 没登陆，登录但是没有互动（）-----处理未授权用户何以授权用户小技巧✔
      );

      // 该观众的所有订阅记录
      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select()
          .from(subscriptions)
          .where(inArray(subscriptions.viewerId, userId ? [userId] : []))
      );

      const [existingVideo] = await db
        .with(viewerReactions, viewerSubscriptions) //.with() 将其引入主查询中，使其可被引用。
        .select({
          ...getTableColumns(videos),
          // 作者的信息
          user: {
            ...getTableColumns(users),
            subscriberCount: db.$count(
              subscriptions,
              eq(subscriptions.creatorId, users.id)
            ), //每个作者和订阅者对应一条记录，查询包含该creator有几条记录
            viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(
              Boolean
            ), //看有没有订阅---isNOtNUll在一个查询的select里面，会返回一个未知类型，所以使用操作符mapWith(Boolean)，将他赋值给boolean类型
          },
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)), //子查询，与主查询的 videos 表动态关联：统计观看次数 关联当前视频的ID
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like")
            )
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike")
            )
          ),
          // 也要拿到viewer的态度，
          viewerReaction: viewerReactions.type,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id)) // 关联作者，
        .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id)) //viewerReaction 可能不存在（用户未登录或未互动），所以要用左连接。
        // TODO:是不是制成一个表，再从表中查询❓
        .leftJoin(
          viewerSubscriptions,
          eq(viewerSubscriptions.creatorId, users.id) //这里的users.id依赖于innerjoin的查询
        ) //viewerReaction 可能不存在（用户未登录或未互动），所以要用左连接。
        .where(eq(videos.id, input.id))
        .limit(1)
        .groupBy(
          videos.id,
          users.id,
          viewerReactions.type,
          viewerSubscriptions.viewerId
        ); //TODO:没有使用聚合函数的  有count
      // 先使用where筛选出目标视频，再子查询，
      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return existingVideo;
    }),
  // TODO:workflow.trigger:触发远程的工作流执行。
  // 当用户请求生成视频标题时，后端并不直接处理，
  // 而是通过调用外部服务（如Upstash）来启动一个工作流，
  // 这可能涉及调用AI服务或其他耗时任务，从而异步处理请求
  // 返回的workflowRunId可以让客户端轮询或通过Webhook获取结果。
  generateTitle: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
        body: { userId, videoId: input.id },
      });
      return workflowRunId;
    }),

  generateDescription: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
        body: { userId, videoId: input.id },
      });
      return workflowRunId;
    }),

  generateThumbnail: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(10),
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      // TODO:干什么的->开启后台任务
      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
        body: { userId, videoId: input.id, prompt: input.prompt },
      });
      return workflowRunId;
    }),

  // 如果只依靠webhook的返回设置状态，不保险。这里通过muxUploadId->assect->muxStatus,muxPlaybackId
  // 如果webhooks失败了，如果webhooks失控了。。uploadedId是创建和upload.create连接时返回的
  revalidate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      if (!userId) throw new TRPCError({ code: "BAD_REQUEST" });

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

      if (!existingVideo) throw new TRPCError({ code: "BAD_REQUEST" });
      if (!existingVideo.muxUploadId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const upload = await mux.video.uploads.retrieve(
        existingVideo.muxUploadId
        //TODO:muxuploaded
      );
      if (!upload || !upload.asset_id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const assest = await mux.video.assets.retrieve(upload.asset_id);
      if (!assest) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const playbackId = assest.playback_ids?.[0].id;
      const duration = assest.duration ? Math.round(assest.duration * 1000) : 0;
      // const trackId=assest.tracks[0].id,
      // const trackStatus=assest.tracks[0].status,
      // TODO:自己找方法验证track
      const [updatedVideo] = await db
        .update(videos)
        .set({
          muxStatus: assest.status,
          muxPlaybackId: playbackId,
          muxAssetId: assest.id,
          duration,
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();
      return updatedVideo;
    }),

  restoreThumbnail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      if (!userId) throw new TRPCError({ code: "BAD_REQUEST" });

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

      if (!existingVideo) throw new TRPCError({ code: "NOT_FOUND" });

      // 重置
      if (existingVideo.thumbnailKey) {
        const utapi = new UTApi();
        await utapi.deleteFiles(existingVideo.thumbnailKey);
        await db
          .update(videos)
          .set({
            thumbnailKey: null,
            thumbnailUrl: null,
          })
          .where(and(eq(videos.userId, userId), eq(videos.id, input.id)));
      }
      if (!existingVideo.muxPlaybackId)
        throw new TRPCError({ code: "BAD_REQUEST" });
      // TODO:用upload服务,之后不用受制于url, 图片来源只有服务器端上传，
      const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;
      const utapi = new UTApi();
      const uploadedThumbnail = await utapi.uploadFilesFromUrl(
        tempThumbnailUrl
      );
      if (!uploadedThumbnail.data) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          thumbnailUrl: uploadedThumbnail.data.url,
          thumbnailKey: uploadedThumbnail.data.key,
        })
        // TODO:重置恢复不需要用到upload,不获得key,也不需要，所以一开始创建上传，就把他推送到upload
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();
      return updatedVideo;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      // const [willRemoveVideo] = await db
      //   .select()
      //   .from(videos)
      //   .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
      // if (!willRemoveVideo) {
      //   throw new TRPCError({ code: "NOT_FOUND" });
      // }
      // // TODO:删除数据库前，也删除upload上缓存
      // if (willRemoveVideo.thumbnailKey && willRemoveVideo.previewKey) {
      //   const utapi = new UTApi();
      //   await utapi.deleteFiles([
      //     willRemoveVideo.thumbnailKey,
      //     willRemoveVideo.previewKey,
      //   ]);
      // }

      const [removedVideo] = await db
        .delete(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();
      if (!removedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return removedVideo;
    }),
  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const [updatedVideo] = await db
        .update(videos)
        .set({
          // ...input,这是一个api端点，希望控制更新内容，防止恶意
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility,
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();
      if (!updatedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return updatedVideo;
    }),
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;
    // 创建upload上传权限,创建上传端点,
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        playback_policy: ["public"],
        // TODO:input 字段的作用是 为上传的视频生成自动字幕。
        input: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              },
            ],
          },
        ],
      },
      cors_origin: "*", //上传域TODO:，但在生产环境建议改为特定域名：设置自己的url
    });
    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: "Untitled",
        muxUploadId: upload.id,
        muxStatus: "waiting",
      })
      .returning();
    // TODO:returning()，用于delect,insert，update干什么->直接返回修改后的值，不用再查询一边

    // 返回视频信息和上传URL供前端使用
    return {
      video: video,
      url: upload.url,
    };
  }),
});
