import { LikedVideosSection } from "../sections/liked-videos-section copy";

export const LikedView = () => {
  return (
    // 每个section有良好的封装，一个出问题不让整个View崩溃
    <div className="max-w-screen-md mx-auto mb-10 pt-2.5 flex flex-col gap-y-6  ">
      <div>
        <h1 className="text-2xl font-bold">Liked </h1>
        <p className="text-xs text-muted-foreground"> views you liked</p>
      </div>
      <LikedVideosSection />
    </div>
  );
};
