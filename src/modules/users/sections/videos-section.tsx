"use client";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import {
  VideoGirdCard,
  VideoGirdCardSkeleton,
} from "@/modules/videos/ui/components/video-grid-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface VideosSectionProps {
  userId: string;
}
export const VideosSection = ({ userId }: VideosSectionProps) => {
  return (
    <Suspense key={userId} fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>error...</p>}>
        <VideosSectionSuspense userId={userId} />
      </ErrorBoundary>
    </Suspense>
  );
};
const VideosSectionSkeleton = () => {
  return (
    <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 ">
      {Array.from({ length: 18 }).map((_, index) => (
        <VideoGirdCardSkeleton key={index} />
      ))}
    </div>
  );
};
const VideosSectionSuspense = ({ userId }: VideosSectionProps) => {
  const [videos, query] = trpc.videos.getMany.useSuspenseInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
      userId,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <div>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 ">
        {videos.pages
          .flatMap((page) => page.items)
          .map((video) => (
            <VideoGirdCard data={video} key={video.id} />
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
