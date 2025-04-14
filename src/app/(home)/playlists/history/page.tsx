import { DEFAULT_LIMIT } from "@/constants";
import { HistoryView } from "@/modules/playlists/ui/views/history-view";
import { HydrateClient, trpc } from "@/trpc/server";
export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.playlists.getHistory.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  });

  return (
    // 客户端渲染时，把预取数据注入
    <HydrateClient>
      <HistoryView />
    </HydrateClient>
  );
};
export default Page;
