import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { THUMBNAIL_FULLBACK } from "@/modules/videos/constant";
import { ListVideoIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

interface PlaylistThumbnailProps {
  imageUrl?: string | null;
  className?: string;
  videoCount: number;
  title: string;
}
export const PlaylistThumbnailSkeleton = () => {
  return (
    <div className="relative w-full rounded-xl overflow-hidden  aspect-video">
      <Skeleton className="size-full" />
    </div>
  );
};
export const PlaylistThumbnail = ({
  imageUrl,
  title,
  videoCount,
  className,
}: PlaylistThumbnailProps) => {
  const compactVideoCount = useMemo(() => {
    return new Intl.NumberFormat("en", {
      notation: "compact",
    }).format(videoCount);
  }, [videoCount]);

  return (
    <div className={cn("relative pt-3 ", className)}>
      {/* 栈效果 */}
      <div className="relative">
        {/* abolute  absolute 会脱离标准流 其他元素会忽略它的存在，布局时会当作它不存在。 */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[97%] overflow-hidden rounded-xl bg-black/20 aspect-video" />
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[98.5%] overflow-hidden rounded-xl bg-black/25 aspect-video" />
        {/* 主图 */}
        <div className="relative  w-full overflow-hidden rounded-xl  aspect-video">
          <Image
            src={imageUrl || THUMBNAIL_FULLBACK}
            alt={title}
            className="w-full h-full object-cover"
            fill
          />
          {/* 悬 
          inset-0: --->top: 0;right: 0;bottom: 0;left: 0;即让元素撑满其定位父容器  */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/70">
            <div className="flex items-center gap-x-2">
              <PlayIcon className="size-4 text-white fill-white" />
              <span className="text-white font-medium">Play all</span>
            </div>
          </div>
        </div>
      </div>

      {/* video count */}
      <div
        className="absolute bottom-2 right-1 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium
      flex items-center gap-x-1"
      >
        <ListVideoIcon className="size-4" />
        {compactVideoCount} videos
      </div>
    </div>
  );
};
