"use client";

import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { VideoRowCard } from "../components/video-row-card";
import { VideoGirdCard } from "../components/video-grid-card";
interface SuggestionsSectionProps {
  videoId: string;
}
export const SuggestionsSection = ({ videoId }: SuggestionsSectionProps) => {
  const [suggestions] = trpc.suggestions.getMany.useSuspenseInfiniteQuery(
    {
      videoId,
      limit: DEFAULT_LIMIT,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  return (
    <>
      <div className="hidden md:block space-y-3">
        {suggestions.pages.flatMap((page) =>
          page.items.map((video) => (
            <VideoRowCard data={video} key={video.id} size="compact" />
          ))
        )}
      </div>
      <div className="block md:hidden space-y-10">
        {suggestions.pages.flatMap((page) =>
          page.items.map((video) => (
            <VideoGirdCard data={video} key={video.id} />
          ))
        )}
      </div>
    </>
  );
};
