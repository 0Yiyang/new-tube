import { CategoriesSection } from "../sections/categories-setion";
import { HomeVideosSection } from "../sections/home-videos-section";

interface HomeViewProps {
  categoryId?: string;
}
export const HomeView = ({ categoryId }: HomeViewProps) => {
  return (
    // 每个section有良好的封装，一个出问题不让整个View崩溃
    <div className="max-w-[2400px] mx-auto mb-10 pt-2.5 flex flex-col gap-y-6 ">
      <CategoriesSection categoryId={categoryId} />
      <HomeVideosSection categoryId={categoryId} />
    </div>
  );
};
