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

interface ResultsSectionProps {
  query: string | undefined;
  categoryId: string | undefined;
}

export const ResultsSection = ({ query, categoryId }: ResultsSectionProps) => {
  return (
    //TODO:在 Transition 期间，React 将避免隐藏已显示的内容。
    // 但是，如果你导航到具有不同参数的路由，你可能想告诉 React 它是不同的内容。你可以用 key 来表示：
    <Suspense
      key={`${query}-${categoryId}`}
      fallback={<ResultsSectionSkeleton />}
    >
      <ErrorBoundary fallback={<p>error...</p>}>
        <ResultsSectionSuspense query={query} categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const ResultsSectionSkeleton = () => {
  return (
    <>
      <div className="hidden  md:flex flex-col gap-4 ">
        {Array.from({ length: 5 }).map((_, index) => (
          <VideoRowCardSkeleton key={index} />
        ))}
      </div>

      <div className="flex flex-col gap-4 p-4 mt-6 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <VideoGirdCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
};

const ResultsSectionSuspense = ({ query, categoryId }: ResultsSectionProps) => {
  const [results, resultQuery] = trpc.search.getMany.useSuspenseInfiniteQuery(
    {
      query,
      categoryId,
      limit: DEFAULT_LIMIT,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  // console.log(query);
  return (
    <>
      <div className="flex flex-col gap-4 space-y-10 md:hidden">
        {results.pages
          .flatMap((page) => page.items)
          .map((video) => (
            <VideoGirdCard data={video} key={video.id} />
          ))}
      </div>

      <div className="hidden flex-col gap-4 space-y-10 md:flex">
        {results.pages
          .flatMap((page) => page.items)
          .map((video) => (
            <VideoRowCard data={video} key={video.id} />
          ))}
      </div>

      <InfiniteScroll
        hasNextPage={resultQuery.hasNextPage}
        isFetchingNextPage={resultQuery.isFetchingNextPage}
        fetchNextPage={resultQuery.fetchNextPage}
      />
    </>
  );
};
