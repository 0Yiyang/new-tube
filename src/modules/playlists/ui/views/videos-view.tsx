import { PlaylistHeaderSection } from "../sections/playlist-header-section";
import { VideosSection } from "../sections/videos-section";
interface VideosViewProps {
  playlistId: string;
}
export const VideosView = ({ playlistId }: VideosViewProps) => {
  return (
    // 每个section有良好的封装，一个出问题不让整个View崩溃
    <div className="max-w-screen-md mx-auto mb-10 pt-2.5 flex flex-col gap-y-6 border ">
      <PlaylistHeaderSection playlistId={playlistId} />
      <VideosSection playlistId={playlistId} />
    </div>
  );
};
