import { PlayListGetManyOutPut } from "@/modules/playlists/type";
import { THUMBNAIL_FULLBACK } from "@/modules/videos/constant";
import Link from "next/link";
import { PlaylistInfo, PlaylistInfoSkeleton } from "./playlist-info";
import {
  PlaylistThumbnail,
  PlaylistThumbnailSkeleton,
} from "./playlist-thumbnail";

interface PlaylistGridCardProps {
  data: PlayListGetManyOutPut["items"][number];
}

export const PlaylistGridCardSkeleton = () => {
  return (
    <div className="flex flex-col w-full gap-2 ">
      <PlaylistThumbnailSkeleton />
      <PlaylistInfoSkeleton />
    </div>
  );
};
export const PlaylistGridCard = ({ data }: PlaylistGridCardProps) => {
  return (
    <Link href={`/playlists/${data.id}`}>
      <div className="flex flex-col w-full gap-2 group">
        <PlaylistThumbnail
          imageUrl={data.thumbnailUrl || THUMBNAIL_FULLBACK}
          title={data.name}
          videoCount={data.videoCount}
        />
        <PlaylistInfo data={data} />
      </div>
    </Link>
  );
};
