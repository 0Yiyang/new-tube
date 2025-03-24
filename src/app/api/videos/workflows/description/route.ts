import db from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
interface InputType {
  userId: string;
  videoId: string;
}
const DESCRIPTION_SYSTEM_PROMPT = `Your task is to summarize the transcript of a video.
 Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necessary for the context.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- ONLY return the summary, no other text, annotations, or comments.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.`;
export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType;
  const { videoId, userId } = input;

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

  const transcript = await context.run("get-transcript", async () => {
    const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
    const response = await fetch(trackUrl);
    const text = await response.text();
    if (!text) {
      throw new Error("Bad request");
    }
    return text;
  });

  // 调用api,ai生成
  const { body } = await context.api.openai.call("generate-description", {
    baseURL: "https://api.deepseek.com",
    token: process.env.DEEPSEEK_API_KEY!,
    operation: "chat.completions.create",
    body: {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: DESCRIPTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    },
  });

  // 最好在步骤之操作，在步骤内部失败会retry,如果直接抛出异常，不确定会不会影响retry
  const description = body.choices[0]?.message.content;
  if (!description) {
    throw new Error("Bad request");
  }
  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({ description: description || video.description })
      .where(and(eq(videos.userId, video.userId), eq(videos.id, video.id)));
  });
});
