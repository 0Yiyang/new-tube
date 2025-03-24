import db from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
interface InputType {
  userId: string;
  videoId: string;
}
const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for YouTube video based on its transcripts.
Please follow these guidelines:
-	Be concise but descriptive, using relevant keywards to improve discoverability.	
- Highlight the most compelling or unique aspect of the video content.
-	Avoid jargon or overly complex language unless it directly supports searchability,	
-	Use action-oriented phrasing or clear value propositions where applicable.	
-	Ensure the title is 3-8 wards long and no more than 100 characters.	
-	ONLY return the title as plain text. Do not add quotes or any additional formatting.`;
export const { POST } = serve(async (context) => {
  const { userId, videoId } = context.requestPayload as InputType;
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
  //
  const transcript = await context.run("get-transcript", async () => {
    const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
    const response = await fetch(trackUrl);
    const text = await response.text();
    if (!text) {
      throw new Error("Bad request");
    }
    return text;
  });

  // 调用api,ai生成标题
  const { body } = await context.api.openai.call("generate-title", {
    baseURL: "https://api.deepseek.com",
    token: process.env.DEEPSEEK_API_KEY!,
    operation: "chat.completions.create",
    body: {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: TITLE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    },
  });

  // 最好在步骤之操作，在步骤内部失败会retry,如果直接抛出异常，不确定会不会影响retry
  const title = body.choices[0]?.message.content;
  if (!title) {
    throw new Error("Bad request");
  }
  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({ title: title || video.title })
      .where(and(eq(videos.userId, video.userId), eq(videos.id, video.id)));
  });
});
