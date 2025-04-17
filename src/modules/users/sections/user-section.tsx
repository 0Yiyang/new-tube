"use client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  UserPageBanner,
  UserPageBannerSkeleton,
} from "../ui/components/user-page-banner";
import {
  UserPageInfo,
  UserPageInfoSkeleton,
} from "../ui/components/user-page-info";
import { trpc } from "@/trpc/client";
import { Separator } from "@/components/ui/separator";

interface UserSectionProps {
  userId: string;
}
export const UserSection = ({ userId }: UserSectionProps) => {
  return (
    <Suspense fallback={<UserSectionSkeleton />}>
      <ErrorBoundary fallback={<p>error...</p>}>
        <UserSectionSuspense userId={userId} />
      </ErrorBoundary>
    </Suspense>
  );
};
const UserSectionSkeleton = () => {
  return (
    <div className="flex flex-col">
      <UserPageBannerSkeleton />
      <UserPageInfoSkeleton />
      <Separator />
    </div>
  );
};

const UserSectionSuspense = ({ userId }: UserSectionProps) => {
  const [data] = trpc.users.getOne.useSuspenseQuery({ id: userId });
  return (
    <div className="flex flex-col">
      <UserPageBanner user={data} />
      <UserPageInfo user={data} />
      <Separator />
    </div>
  );
};
