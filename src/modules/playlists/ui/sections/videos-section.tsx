"use client";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import {
  VideoGirdCard,
  VideoGirdCardSkeleton,
} from "@/modules/videos/ui/components/video-grid-card";
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from "@/modules/videos/ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
interface VideoSectionProps {
  playlistId: string;
}
export const VideosSection = ({ playlistId }: VideoSectionProps) => {
  return (
    <Suspense fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>error...</p>}>
        <VideosSectionSuspense playlistId={playlistId} />
      </ErrorBoundary>
    </Suspense>
  );
};
const VideosSectionSkeleton = () => {
  return (
    <>
      <div className="gap-4 gap-y-10 flex flex-col md:hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <VideoGirdCardSkeleton key={index} />
        ))}
      </div>
      <div className="gap-4   flex-col md:flex hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <VideoRowCardSkeleton key={index} size="compact" />
        ))}
      </div>
    </>
  );
};
const VideosSectionSuspense = ({ playlistId }: VideoSectionProps) => {
  const [data, query] = trpc.playlists.getVideos.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT, playlistId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  const utils = trpc.useUtils();
  const removeVideo = trpc.playlists.removeVideo.useMutation({
    onSuccess: (data) => {
      toast.success("removed from playlist");
      utils.playlists.getMany.invalidate();
      utils.playlists.getOne.invalidate({ id: data.playlistId });
      utils.playlists.getManyForVideo.invalidate({ videoId: data.videoId });
      utils.playlists.getVideos.invalidate({ playlistId: data.playlistId });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });
  return (
    <div>
      <div className="gap-4 gap-y-10 flex flex-col md:hidden">
        {data.pages
          .flatMap((page) => page.items)
          .map((video) => (
            <VideoGirdCard
              data={video}
              key={video.id}
              onRemove={() =>
                removeVideo.mutate({ videoId: video.id, playlistId })
              }
            />
          ))}
      </div>
      <div className="gap-4   flex-col hidden md:flex">
        {data.pages
          .flatMap((page) => page.items)
          .map((video) => (
            <VideoRowCard
              data={video}
              key={video.id}
              size="compact"
              onRemove={() =>
                removeVideo.mutate({ videoId: video.id, playlistId })
              }
            />
          ))}
      </div>
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};
