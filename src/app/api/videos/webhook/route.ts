import { headers } from "next/headers";
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
  VideoAssetDeletedWebhookEvent,
} from "@mux/mux-node/resources/webhooks";
import { mux } from "@/lib/mux";
import db from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!;

type WebhookEvent =
  | VideoAssetCreatedWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetTrackReadyWebhookEvent
  | VideoAssetDeletedWebhookEvent;

export const POST = async (request: Request) => {
  if (!SIGNING_SECRET) {
    throw new Error("MUX_WEBHOOK_SECRET is not found");
  }
  const headersPayload = await headers();
  const muxSignature = headersPayload.get("mux-signature");
  if (!muxSignature) {
    return new Response("NO signature found", { status: 401 });
  }
  const payload = await request.json();
  const body = JSON.stringify(payload);
  // TODO:ai   401和400
  mux.webhooks.verifySignature(
    body,
    {
      "mux-signature": muxSignature,
    },
    SIGNING_SECRET
  );
  // mux向该程序的webhook发请求，带着data

  switch (payload.type as WebhookEvent["type"]) {
    case "video.asset.created": {
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"];
      if (!data.upload_id) {
        return new Response("NO upload ID found", { status: 400 });
      }
      console.log("Creating video:", data.upload_id);

      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }

    case "video.asset.ready": {
      const data = payload.data as VideoAssetReadyWebhookEvent["data"];
      const playbackId = data.playback_ids?.[0].id;
      if (!data.upload_id) {
        return new Response("Missing upload id", { status: 400 });
      }
      // playbackID只会在ready出现,但是也要做好应对没有palybackId的准备
      if (!playbackId) {
        return new Response("Missing playback id", { status: 400 });
      }

      // //TODO: 检查是否已经处理过
      // const [existingVideo] = await db
      //   .select({
      //     thumbnailUrl: videos.thumbnailUrl,
      //     previewUrl: videos.previewUrl,
      //   })
      //   .from(videos)
      //   .where(eq(videos.muxUploadId, data.upload_id));
      // if (existingVideo.thumbnailUrl) {
      //   console.log("Thumbnail and preview already uploaded.");
      //   return new Response("Already processed", { status: 200 });
      // }

      // 从创建开始就上传到upload
      const tempthumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      const temppreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
      const duration = data.duration ? Math.round(data.duration * 1000) : 0;

      const utapi = new UTApi();
      const [uploadedThumbnailUrl, uploadedPreviewUrl] =
        await utapi.uploadFilesFromUrl([tempthumbnailUrl, temppreviewUrl]);
      if (!uploadedThumbnailUrl.data || !uploadedPreviewUrl.data) {
        return new Response("Failed to upload thumbnail or preview", {
          status: 500,
        });
      }

      const thumbnailKey = uploadedThumbnailUrl.data.key;
      const thumbnailUrl = uploadedThumbnailUrl.data.url;
      const previewKey = uploadedPreviewUrl.data.key;
      const previewUrl = uploadedPreviewUrl.data.url;
      // const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnailUrl.data;
      // const { key: previewKey, url: previewUrl } = uploadedPreviewUrl?.data;
      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
          muxPlaybackId: playbackId,
          thumbnailUrl,
          thumbnailKey,
          previewUrl,
          previewKey,
          duration,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }
    case "video.asset.errored": {
      const data = payload.data as VideoAssetErroredWebhookEvent["data"];
      if (!data.upload_id) {
        return new Response("NO upload ID found", { status: 400 });
      }
      await db
        .update(videos)
        .set({
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }
    case "video.asset.deleted": {
      const data = payload.data as VideoAssetDeletedWebhookEvent["data"];
      if (!data.upload_id) {
        return new Response("NO upload ID found", { status: 400 });
      }
      console.log("Deleting video:", data.upload_id);
      await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));

      break;
    }
    case "video.asset.track.ready": {
      const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
        asset_id: string;
      };
      if (!data.asset_id) {
        return new Response("NO asset ID found", { status: 400 });
      }
      const trackId = data.id;
      const trackStatus = data.status;
      console.log("Tracking video");
      await db
        .update(videos)
        .set({
          muxTrackId: trackId,
          muxTrackStatus: trackStatus,
        })
        .where(eq(videos.muxAssetId, data.asset_id));
      break;
    }
  }
  return new Response("Webhook received", { status: 200 });
};
