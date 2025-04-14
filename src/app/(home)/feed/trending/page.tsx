import { DEFAULT_LIMIT } from "@/constants";
import { TrendingView } from "@/modules/home/ui/views/trending-view";
import { HydrateClient, trpc } from "@/trpc/server";
export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.videos.getManyTrending.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  });

  return (
    // 客户端渲染时，把预取数据注入
    <HydrateClient>
      <TrendingView />
    </HydrateClient>
  );
};
export default Page;
