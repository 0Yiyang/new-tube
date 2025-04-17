import { z } from "zod";
import { eq, and } from "drizzle-orm";
import db from "@/db";
import { users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();
// 这段代码的核心功能是通过 UploadDropzone 上传文件，并处理权限验证、清理旧文件和保存新文件信息。
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  bannerUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId: clerkUserId } = await auth();
      if (!clerkUserId) throw new UploadThingError("Unauthorized");
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId));
      if (!existingUser) throw new UploadThingError("Unauthorized");

      if (existingUser.bannerKey) {
        const utapi = new UTApi();
        await utapi.deleteFiles(existingUser.bannerKey);
        await db
          .update(users)
          .set({
            bannerKey: null,
            bannerUrl: null,
          })
          .where(eq(users.id, existingUser.id));
      }
      return { userId: existingUser.id }; // 返回值被onUploadComplete 当作`metadata`
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // 上传到Uploadthing成功之后，同步到数据库
      await db
        .update(users)
        .set({
          bannerUrl: file.url,
          bannerKey: file.key,
        })
        .where(eq(users.id, metadata.userId));
      // 当文件上传成功后，服务器端的 onUploadComplete 会执行，
      //  并返回 { uploadedBy: metadata.user.id }。
      // 客户端通过 onClientUploadComplete 接收到这个返回值，
      return { uploadedBy: metadata.userId };
    }),
  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .input(
      z.object({
        videoId: z.string().uuid(),
      })
    )
    // Set permissions and file types for this FileRoute
    .middleware(async ({ input }) => {
      // upload之后运行
      const { userId: clerkUserId } = await auth();
      if (!clerkUserId) throw new UploadThingError("Unauthorized");
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId));
      if (!user) throw new UploadThingError("Unauthorized");

      const [existingVideo] = await db
        .select({ thumbnailKey: videos.thumbnailKey })
        .from(videos)
        .where(and(eq(videos.userId, user.id), eq(videos.id, input.videoId)));
      if (!existingVideo) throw new UploadThingError("Not found");
      // 如果有旧的缩略图缓存，就清除在upload上的缓存，重置数据库
      if (existingVideo.thumbnailKey) {
        const utapi = new UTApi();
        await utapi.deleteFiles(existingVideo.thumbnailKey);
        await db
          .update(videos)
          .set({
            thumbnailKey: null,
            thumbnailUrl: null,
          })
          .where(and(eq(videos.userId, user.id), eq(videos.id, input.videoId)));
      }
      return { user, ...input }; // 返回值被onUploadComplete 当作`metadata`
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // 上传到Uploadthing成功之后，同步到数据库
      await db
        .update(videos)
        .set({
          thumbnailUrl: file.url,
          thumbnailKey: file.key,
        })
        .where(
          and(
            eq(videos.userId, metadata.user.id),
            eq(videos.id, metadata.videoId)
          )
        );
      // 当文件上传成功后，服务器端的 onUploadComplete 会执行，
      //  并返回 { uploadedBy: metadata.user.id }。
      // 客户端通过 onClientUploadComplete 接收到这个返回值，
      return { uploadedBy: metadata.user.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
