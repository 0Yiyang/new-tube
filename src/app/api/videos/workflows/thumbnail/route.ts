import db from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
interface InputType {
  userId: string;
  videoId: string;
  prompt: string;
}
// import axios from "axios";

export const { POST } = serve(async (context) => {
  const { userId, videoId, prompt } = context.requestPayload as InputType;
  //1
  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.userId, userId), eq(videos.id, videoId)));
    if (!existingVideo) {
      throw new Error("Not found");
    }
    return existingVideo;
  });

  // 步骤2:提交请求
  // 这里就不可以用number储存，防止数据丢失

  // // const generateImage = async (prompt: string) => {
  // //   // Step 1: 生成任务 ID
  // //   const thumbnailTaskId: string = await context.run(
  // //     "generate-TaskId",
  // //     async () => {
  // //       try {
  // //         const response = await axios.post(
  // //           `https://aip.baidubce.com/rpc/2.0/wenxin/v1/basic/textToImage?access_token=${process
  // //             .env.BAIDU_ACCESS_TOKEN!}`,
  // //           {
  // //             text: prompt.substring(0, 190), // 确保不超过 190 字符
  // //             resolution: "1024*1024",
  // //             num: 1,
  // //           },
  // //           {
  // //             headers: {
  // //               "Content-Type": "application/json",
  // //               Accept: "application/json",
  // //             },
  // //           }
  // //         );

  // //         if (!response.data || !response.data.taskId) {
  // //           throw new Error("API did not return a valid taskId");
  // //         }

  // //         return String(response.data.taskId); // 以字符串返回，避免 long 精度问题
  // //       } catch (error) {
  // //         throw new Error(`Error generating taskId: ${error}`);
  // //       }
  // //     }
  // //   );

  // //   if (!thumbnailTaskId) {
  // //     throw new Error("Failed to create taskId");
  // //   }
  // //   console.log("✅ 任务 ID 获取成功:", thumbnailTaskId);

  // //   // Step 2: 轮询查询任务结果
  // //   const pollImage = async (taskId: string, retries = 10, delay = 5000) => {
  // //     for (let i = 0; i < retries; i++) {
  // //       console.log(`⏳ 第 ${i + 1} 次查询任务状态...`);

  // //       try {
  // //         const response = await axios.post(
  // //           `https://aip.baidubce.com/rpc/2.0/wenxin/v1/basic/getImg?access_token=${process
  // //             .env.BAIDU_ACCESS_TOKEN!}`,
  // //           { taskId }, // 传字符串类型的 taskId
  // //           {
  // //             headers: {
  // //               "Content-Type": "application/json",
  // //               Accept: "application/json",
  // //             },
  // //           }
  // //         );

  // //         const result = response.data;
  // //         console.log("📌 查询结果:", result);

  // //         if (result?.data?.status === 1) {
  // //           console.log("✅ 图片生成成功:", result.data.img);
  // //           return result.data.img; // 返回图片 URL
  // //         }

  // //         if (result?.error_code) {
  // //           console.error(
  // //             `❌ API Error: ${result.error_msg} (Code: ${result.error_code})`
  // //           );
  // //           throw new Error(
  // //             `API Error: ${result.error_msg} (Code: ${result.error_code})`
  // //           );
  // //         }
  // //       } catch (error) {
  // //         console.error("查询任务失败:", error);
  // //       }

  // //       console.log("⏳ 任务未完成，等待 5 秒...");
  // //       await new Promise((resolve) => setTimeout(resolve, delay));
  // //     }

  // //     throw new Error("⏳ 超时: 任务未在规定时间内完成");
  // //   };

  // //   const tempThumbnailUrl = await pollImage(thumbnailTaskId);

  // //   if (!tempThumbnailUrl) {
  // //     throw new Error("Failed to generate image");
  // //   }

  // //   return tempThumbnailUrl;
  // // };

  // // 调用示例
  // const tempThumbnailUrl = await generateImage(prompt);

  // 使用openai

  const { body } = await context.call<{ data: { url: string }[] }>(
    "genernate-thumbnail",
    {
      url: "https://api.openai.com/v1/images/generations",
      method: "POST",
      body: {
        prompt,
        n: 1,
        modal: "dall-e-3",
        size: "1792*1024",
      },
      headers: {
        authorization: `Bearer <YOU OPEN_API_KEY>`,
      },
    }
  );
  const tempThumbnailUrl = body.data[0].url;
  // 验证生成结果
  if (!tempThumbnailUrl) {
    throw new Error("Bad request");
  }

  // const imageUrl = imgUrl;

  // 步骤4: 更新视频缩略图
  // 先清理旧缩略图
  const utapi = new UTApi();
  await context.run("cleanup-thumbnail", async () => {
    if (video.thumbnailKey) {
      await utapi.deleteFiles(video.thumbnailKey);
      await db
        .update(videos)
        .set({
          thumbnailKey: null,
          thumbnailUrl: null,
        })
        .where(and(eq(videos.userId, userId), eq(videos.id, videoId)));
    }
  });
  // 这些ai生成的url，只会存在一段时间，我们需要把资源永久储存到uploadthing
  //上传到永久存储
  const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
    const { data } = await utapi.uploadFilesFromUrl(tempThumbnailUrl);
    if (!data) {
      throw new Error("Failed to upload thumbnail ");
    }
    return data;
  });

  await context.run("update-vedio", async () => {
    await db
      .update(videos)
      .set({
        thumbnailKey: uploadedThumbnail.key,
        thumbnailUrl: uploadedThumbnail.url,
      })
      .where(and(eq(videos.userId, userId), eq(videos.id, videoId)));
  });

  // 使用openai
  // const { body } = await context.call<{ data: { url: string }[] }>(
  //   "genernate-thumbnail",
  //   {
  //     url: "https://api.openai.com/v1/images/generation",
  //     method: "POST",
  //     body: {
  //       prompt,
  //       n: 1,
  //       modal: "dall-e-3",
  //       size: "1792*1024",
  //     },
  //     headers: {
  //       authorization: `Bearer <YOU OPEN_API_KEY>`,
  //     },
  //   }
  // );
  // const tempthumbnailUrl = body.data[0].url;
});
