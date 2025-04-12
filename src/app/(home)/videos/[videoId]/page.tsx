import { DEFAULT_LIMIT } from "@/constants";
import { VideoView } from "@/modules/videos/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server";
export const dynamic = "force-dynamic"; //TODO:这不是一个静态页面-----因为void trpc。。。在内部预获取--是动态获取。如果静态渲染就无法动态获取数据

interface PageProps {
  params: Promise<{ videoId: string }>;
}
const Page = async ({ params }: PageProps) => {
  const { videoId } = await params;
  // 预加载视频
  void trpc.videos.getOne.prefetch({ id: videoId });

  void trpc.comments.getMany.prefetchInfinite({
    videoId,
    limit: DEFAULT_LIMIT,
  });
  void trpc.suggestions.getMany.prefetchInfinite({
    videoId,
    limit: DEFAULT_LIMIT,
  });
  return (
    <HydrateClient>
      <VideoView videoId={videoId} />
    </HydrateClient>
  );
};
export default Page;
