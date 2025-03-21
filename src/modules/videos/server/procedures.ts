import db from "@/db";
import { videos, videoUpdateSchema } from "@/db/schema";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

export const videosRouter = createTRPCRouter({
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
    // 创建upload上传权限,创建上传端点
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

    return {
      video: video,
      url: upload.url,
    };
  }),
});
