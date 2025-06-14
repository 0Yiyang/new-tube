import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";

interface VideoDescriptionProps {
  compactViews: string;
  expandedViews: string;
  compactDate: string;
  expandedDate: string;
  description?: string | null;
}
export const VideoDescription = ({
  compactViews,
  expandedViews,
  compactDate,
  expandedDate,
  description,
}: VideoDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div
      onClick={() => setIsExpanded((current) => !current)}
      className="rounded-xl p-3 cursor-pointer bg-secondary/50 hover:bg-secondary/70 transition"
    >
      <div className="flex gap-2 text-sm mb-2">
        <span className="font-medium">
          {isExpanded ? expandedViews : compactViews} views
        </span>
        <span className="font-medium">
          {isExpanded ? expandedDate : compactDate}
        </span>
      </div>
      <div className="relative">
        {/* TODO: whitespace-pre-wrap:保留原始换行和空格,超出容器宽度自动换行：保留文本格式，兼顾自动换行 */}
        <p
          className={cn(
            "text-sm whitespace-pre-wrap",
            !isExpanded && "line-clamp-2"
          )}
        >
          {description || "No description"}
        </p>
      </div>
      <div className="flex items-center gap-1 mt-4 text-sm font-medium">
        {isExpanded ? (
          <>
            Show less
            <ChevronUpIcon className="size-4" />
          </>
        ) : (
          <>
            Show more
            <ChevronDownIcon className="size-4" />
          </>
        )}
      </div>
    </div>
  );
};
