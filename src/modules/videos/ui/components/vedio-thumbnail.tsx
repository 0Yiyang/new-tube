import { formatDuration } from "@/lib/utils";
import Image from "next/image";
import { THUMBNAIL_FULLBACK } from "../../constant";
import { Skeleton } from "@/components/ui/skeleton";
interface VideoThumbnailProps {
  title: string;
  duration: number;
  imageUrl?: string | null;
  previewUrl?: string | null;
}
export const VideoThumbnailSkeleton = () => {
  return (
    <div className=" relative aspect-video overflow-hidden rounded-xl w-full ">
      <Skeleton className="size-full" />
    </div>
  );
};
export const VideoThumbnail = ({
  title,
  imageUrl,
  previewUrl,
  duration,
}: VideoThumbnailProps) => {
  return (
    // TODO:为什么用group：group 用于在父元素上定义状态，子元素通过 group-* 类响应这些状态。
    <div className="relative group">
      {/* Thumbnail wrapper */}
      {/* TODO:解析css 顺序是什么，从外到内 */}
      <div className="relative w-full overflow-hidden aspect-video rounded-xl">
        {/*TODO: fill 和object-cover一起出现 图片按原比例填充父容器，超出部分被裁剪。 */}
        <Image
          src={imageUrl || THUMBNAIL_FULLBACK}
          alt={title}
          fill
          className="w-full h-full object-cover  group-hover:opacity-0"
        />
        <Image
          unoptimized={!!previewUrl}
          // 有动画就不对动画优化
          src={previewUrl || THUMBNAIL_FULLBACK}
          alt={title}
          fill
          className="w-full h-full object-cover opacity-0  group-hover:opacity-100"
        />
      </div>
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-sm">
        {formatDuration(duration)}
      </div>
      {/* TODO: add Video duration box */}
    </div>
  );
};
