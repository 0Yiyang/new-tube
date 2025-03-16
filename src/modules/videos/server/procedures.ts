import db from "@/db";
import { videos } from "@/db/schema";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videosRouter = createTRPCRouter({
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
    // TODO:returning()干什么
    // TODO:为什么要return
    return {
      video: video,
      url: upload.url,
    };
  }),
});
