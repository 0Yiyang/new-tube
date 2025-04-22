import { SubscribedVideosSection } from "../sections/subscribed-videos-section";

export const SubscribedView = () => {
  return (
    // 每个section有良好的封装，一个出问题不让整个View崩溃
    <div className="max-w-[2400px] mx-auto mb-10 pt-2.5 flex flex-col gap-y-6  ">
      <div>
        <h1 className="text-2xl font-bold">Subscribed</h1>
        <p className="text-xs text-muted-foreground">subscribers videos</p>
      </div>
      <SubscribedVideosSection />
    </div>
  );
};
