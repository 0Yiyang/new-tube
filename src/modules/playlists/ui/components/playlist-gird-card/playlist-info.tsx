import { Skeleton } from "@/components/ui/skeleton";
import { PlayListGetManyOutPut } from "@/modules/playlists/type";

interface PlaylistInfoProps {
  data: PlayListGetManyOutPut["items"][number];
}

export const PlaylistInfoSkeleton = () => {
  return (
    <div className="flex gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-5 w-[90%]" />
        <Skeleton className="h-5 w-[70%]" />
        <Skeleton className="h-5 w-[50%]" />
      </div>
    </div>
  );
};
export const PlaylistInfo = ({ data }: PlaylistInfoProps) => {
  return (
    <div className="flex gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="  font-medium line-clamp-1 lg:line-clamp-2 break-words text-sm">
          {data.name}
        </h3>
        <p className="text-sm text-muted-foreground">Playlist</p>
        <p className="text-sm text-muted-foreground font-semibold hover:text-primary">
          view full playlist
        </p>
      </div>
    </div>
  );
};
