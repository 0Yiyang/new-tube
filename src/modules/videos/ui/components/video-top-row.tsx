import { useMemo } from "react";
import { VideoGetOneOutput } from "../../types";
import { VideoDescription } from "./video-description";
import { VideoMenu } from "./video-menu";
import { VideoOwner } from "./video-owner";
import { VideoReactions } from "./video-reactions";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoTopRowProps {
  video: VideoGetOneOutput;
}
export const VideoTopRowSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-4/5 md:w-2/5" />
      </div>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 w-[70%]">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-5 w-4/5 md:w-1/3" />
            <Skeleton className="h-5 w-3/5 md:w-1/5" />
          </div>
        </div>
        <Skeleton className="h-9 w-1/3 md:w-1/6 rounded-full" />
      </div>
      <div className="h-[120px] w-full" />
    </div>
  );
};
export const VideoTopRow = ({ video }: VideoTopRowProps) => {
  // 依赖项不改变，避免重复计算，计算结果不变，减少由子组件依赖（其）变化引起的渲染
  const compactViews = useMemo(() => {
    return new Intl.NumberFormat("en", {
      notation: "compact",
    }).format(video.viewCount);
  }, [video.viewCount]);
  const expandedViews = useMemo(() => {
    return new Intl.NumberFormat("en", {
      notation: "standard",
    }).format(video.viewCount);
  }, [video.viewCount]);
  const compactDate = useMemo(() => {
    return formatDistanceToNow(video.createAt, { addSuffix: true });
  }, [video.createAt]);
  const expandedDate = useMemo(() => {
    return format(video.createAt, "d MMM yyyy");
  }, [video.createAt]);
  return (
    <div className="flex flex-col gap-4 mt-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* 从外到内 默认 */}
        <VideoOwner user={video.user} videoId={video.id} />
        {/* TODO:css */}
        <div className="flex overflow-x-auto sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm:mb-0 gap-2">
          <VideoReactions
            videoId={video.id}
            likes={video.likeCount}
            dislikes={video.dislikeCount}
            viewerReaction={video.viewerReaction}
          />
          <VideoMenu
            videoId={video.id}
            variant="secondary"
            // onRemove={() => {}}
          />
        </div>
      </div>
      <VideoDescription
        compactViews={compactViews}
        expandedViews={expandedViews}
        compactDate={compactDate}
        expandedDate={expandedDate}
        description={video.description}
      />
    </div>
  );
};
