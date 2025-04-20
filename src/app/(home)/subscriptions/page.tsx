import { DEFAULT_LIMIT } from "@/constants";
import { SubscriptionsView } from "@/modules/subscriptions/ui/views/subscriptions-view";
import { HydrateClient, trpc } from "@/trpc/server";
export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.subscriptions.getMany.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  });

  return (
    // 客户端渲染时，把预取数据注入
    <HydrateClient>
      <SubscriptionsView />
    </HydrateClient>
  );
};
export default Page;
