"use client";
import { FilterCarousel } from "@/components/filter-carousel";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
interface CategoriesSectionProps {
  categoryId?: string;
}
export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    // TODO:为什么一定要被着两个包裹起来->Laoding状态和error报错状态
    <Suspense fallback={<CategoriesSkeleton />}>
      <ErrorBoundary fallback={<p>error...</p>}>
        <CategoriesSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
};
const CategoriesSkeleton = () => {
  return <FilterCarousel data={[]} onSelect={() => {}} isLoading />;
};
const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  const router = useRouter();
  const [categories] = trpc.categories.getmany.useSuspenseQuery();
  const data = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));
  // TODO:点击选项，到相应的地址，，子组件传递消息给父组件，带参回调函数
  const onSelect = (value: string | null) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("categoryId", value);
    } else {
      url.searchParams.delete("categoryId");
    }
    // router.push不会预取东西=》Link会默认预取，更加快
    router.push(url.toString());
  };

  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data} />;
};

// onSelect点击有效选项-》跳转到新地址-》解析searchParams,得到当前点击的选项-》FilterCarousel里面的相应选项的风格改变
