import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_URL } from "@/constants";
import { PlaylistAddModal } from "@/modules/playlists/ui/components/playlist-add-modal";
import {
  ListPlusIcon,
  MoreVerticalIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface VideoMenuProps {
  videoId: string;
  onRemove?: () => void;
  variant?: "ghost" | "secondary";
}

export const VideoMenu = ({
  videoId,
  onRemove,
  variant = "ghost",
}: VideoMenuProps) => {
  const [isOpenPlaylistAddModal, setIsOpenPlaylistAddModal] = useState(false);
  const onShare = () => {
    const fullUrl = `${APP_URL}/videos/${videoId}`;
    // 将文本内容写入系统内的剪贴板api
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to the clipboard");
  };
  return (
    <>
      <PlaylistAddModal
        videoId={videoId}
        open={isOpenPlaylistAddModal}
        onOpenChange={setIsOpenPlaylistAddModal}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" className="rounded-full">
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        {/* TODO:阻止事件冒泡，避免意外出发父级元素 */}
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onShare}>
            <ShareIcon className="size-4 mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsOpenPlaylistAddModal(true)}>
            <ListPlusIcon className="size-4 mr-2" />
            Add to playlist
          </DropdownMenuItem>
          {/* 有删除权限才可以移除视频 */}
          {onRemove && (
            <DropdownMenuItem onClick={onRemove}>
              <Trash2Icon className="size-4 mr-2" />
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
