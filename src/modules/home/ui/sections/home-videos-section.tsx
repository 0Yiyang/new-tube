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

interface HomeVideosSectionProps {
  categoryId?: string;
}
export const HomeVideosSection = ({ categoryId }: HomeVideosSectionProps) => {
  return (
    <Suspense key={categoryId} fallback={<HomeVideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>error...</p>}>
        <HomeVideosSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
};
const HomeVideosSectionSkeleton = () => {
  return (
    <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6">
      {Array.from({ length: 18 }).map((_, index) => (
        <VideoGirdCardSkeleton key={index} />
      ))}
    </div>
  );
};
const HomeVideosSectionSuspense = ({ categoryId }: HomeVideosSectionProps) => {
  const [videos, query] = trpc.videos.getMany.useSuspenseInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
      categoryId,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <div>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6">
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
