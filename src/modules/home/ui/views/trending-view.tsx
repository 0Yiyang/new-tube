import { TrendingVideosSection } from "../sections/trending-videos-section";

export const TrendingView = () => {
  return (
    // 每个section有良好的封装，一个出问题不让整个View崩溃
    <div className="max-w-[2400px] mx-auto mb-10 pt-2.5 flex flex-col gap-y-6 border ">
      <div>
        <h1 className="text-2xl font-bold">Trending</h1>
        <p className="text-xs text-muted-foreground">
          Most popular videos at the moment
        </p>
      </div>
      <TrendingVideosSection />
    </div>
  );
};
