import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";

// TODO:实现视频播放反响
export const VideoReactions = () => {
  const viewerReaction: "like" | "dislike" = "like";
  // flex-none: flex 子项保持固定尺寸（不随容器伸缩而变化）
  return (
    <div className="flex items-center flex-none">
      <Button
        variant="secondary"
        className="rounded-l-full rounded-r-none pr-4 gap-2"
      >
        <ThumbsUpIcon
          className={cn("size-5", viewerReaction === "like" && "fill-black")}
        />
        {1}
      </Button>
      {/* 方向-垂直 */}
      <Separator orientation="vertical" className="h-7" />
      <Button
        variant="secondary"
        className="rounded-r-full rounded-l-none pl-3"
      >
        <ThumbsDownIcon
          className={cn("size-5", viewerReaction !== "like" && "fill-black")}
        />
        {1}
      </Button>
    </div>
  );
};
