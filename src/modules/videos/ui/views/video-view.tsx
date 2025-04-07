import { CommentSection } from "../sections/comments-section";
import { SuggestionsSection } from "../sections/suggeations-section";
import { VideoSection } from "../sections/video-section";

interface VideoViewProps {
  videoId: string;
}
export const VideoView = ({ videoId }: VideoViewProps) => {
  return (
    <div className="flex flex-col max-w-[1700px] mx-auto mb-10 pt-2.5 px-4 ">
      <div className="flex flex-col xl:flex-row gap-6 ">
        <div className="flex-1 min-w-0">
          {/* 用 flex-1 必加 min-w-0，除非子项宽度已固定。 */}
          <VideoSection videoId={videoId} />
          <div className="xl:hidden block mt-4">
            <SuggestionsSection />
          </div>
          <CommentSection videoId={videoId} />
        </div>
        {/* ：flex-shrink:1   Flex 容器空间不足时，允许该元素缩小。 */}
        <div className="hidden xl:block w-full xl:w-[380px] 2xl:w-[460px] shrink">
          <SuggestionsSection />
        </div>
      </div>
    </div>
  );
};
