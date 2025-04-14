import { DEFAULT_LIMIT } from "@/constants";
import { SubscribedView } from "@/modules/home/ui/views/subscribed-view";
import { HydrateClient, trpc } from "@/trpc/server";
export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.videos.getManySubscribed.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  });

  return (
    // 客户端渲染时，把预取数据注入
    <HydrateClient>
      <SubscribedView />
    </HydrateClient>
  );
};
export default Page;
