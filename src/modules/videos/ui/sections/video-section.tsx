"use client";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoPlayer, VideoPlayerSkeleton } from "../components/video-player";
import { cn } from "@/lib/utils";
import { VideoBanner } from "../components/video-banner";
import { VideoTopRow, VideoTopRowSkeleton } from "../components/video-top-row";
import { useAuth } from "@clerk/nextjs";

interface VideoSectionProps {
  videoId: string;
}
export const VideoSection = ({ videoId }: VideoSectionProps) => {
  return (
    <Suspense fallback={<VideoSectionSkeleton />}>
      <ErrorBoundary fallback={<p>error...</p>}>
        <VideoSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};
const VideoSectionSkeleton = () => {
  return (
    <>
      <VideoPlayerSkeleton />
      <VideoTopRowSkeleton />
    </>
  );
};
const VideoSectionSuspense = ({ videoId }: VideoSectionProps) => {
  const { isSignedIn } = useAuth();
  const utils = trpc.useUtils();
  // prefetch对应useSusenseQuery,这时可以获得数据
  const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId });
  const createVideoView = trpc.videoViews.create.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id: videoId });
    },
  });
  const handlePlay = () => {
    if (!isSignedIn) return null;
    createVideoView.mutate({ videoId });
  };
  return (
    <>
      <div
        className={cn(
          "aspect-video rounded-xl overflow-hidden bg-black relative ",
          video.muxStatus !== "ready" && "rounded-b-none"
        )}
      >
        <VideoPlayer
          autoPlay={false}
          onPlay={handlePlay}
          playbackId={video.muxPlaybackId}
          thumbnailUrl={video.thumbnailUrl}
        />
      </div>
      <VideoBanner status={video.muxStatus} />
      <VideoTopRow video={video} />
    </>
  );
};
