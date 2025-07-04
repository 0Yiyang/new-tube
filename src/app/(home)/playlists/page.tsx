import { DEFAULT_LIMIT } from "@/constants";
import { PlayListsView } from "@/modules/playlists/ui/views/playlists-view";
import { HydrateClient, trpc } from "@/trpc/server";
export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.playlists.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT });
  return (
    <HydrateClient>
      <PlayListsView />
    </HydrateClient>
  );
};
export default Page;
