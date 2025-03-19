import db from "@/db";
import { videos, videoUpdateSchema } from "@/db/schema";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const videosRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
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
