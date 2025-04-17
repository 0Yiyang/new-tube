import { UserAvatar } from "@/components/user-avatar";
import { UserGetOntOutput } from "../../types";
import { useAuth, useClerk } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { useSubscription } from "@/modules/subscriptions/hooks/use-subscription";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface UserPageInfoProps {
  user: UserGetOntOutput;
}
export const UserPageInfoSkeleton = () => {
  return (
    <div className="py-6">
      {/* 移动端 */}
      <div className="flex flex-col md:hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="h-[60px] w-[60px] rounded-full" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-full mt-3" />
      </div>
      {/* 桌面布局 */}
      <div className="hidden items-start gap-4  md:flex">
        <Skeleton className="h-[160px] w-[160px] rounded-full" />

        <div className="flex-1 min-w-0">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48 mt-4" />
          <Skeleton className="h-10 w-32  rounded-full mt-3" />
        </div>
      </div>
    </div>
  );
};

export const UserPageInfo = ({ user }: UserPageInfoProps) => {
  const { userId, isLoaded } = useAuth();
  const clerk = useClerk();
  const { isPending, onClick } = useSubscription({
    userId: user.id,
    isSubscribed: user.viewerSubscribed,
  });
  return (
    <div className="py-6">
      {/* 移动端 */}
      <div className="flex flex-col md:hidden">
        <div className="flex items-center gap-3">
          <UserAvatar
            size="lg"
            className="h-[60px] w-[60px]"
            imageUrl={user.imageUrl}
            name={user.name}
            onClick={() => {
              if (user.clerkId === userId) {
                clerk.openUserProfile();
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>{user.subscriberCount} subscribers</span>
              <span>&bull;</span>
              <span>{user.videoCount} videos</span>
            </div>
          </div>
        </div>
        {user.clerkId === userId ? (
          <Button
            asChild
            variant="secondary"
            className="w-full rounded-full mt-3"
          >
            <Link href="/studio">Go to studio</Link>
          </Button>
        ) : (
          <SubscriptionButton
            onClick={onClick}
            disable={isPending || !isLoaded}
            isSubscribed={user.viewerSubscribed}
            className="w-full  mt-3"
          />
        )}
      </div>
      {/* 桌面布局 */}
      <div className="hidden items-start gap-4  md:flex">
        <UserAvatar
          size="xl"
          className={cn(
            userId === user.clerkId &&
              "cursor-pointer opacity-80 transition-opacity duration-300"
          )}
          imageUrl={user.imageUrl}
          name={user.name}
          onClick={() => {
            if (user.clerkId === userId) {
              clerk.openUserProfile();
            }
          }}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-bold">{user.name}</h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
            <span>{user.subscriberCount} subscribers</span>
            <span>&bull;</span>
            <span>{user.videoCount} videos</span>
          </div>
          {user.clerkId === userId ? (
            <Button asChild variant="secondary" className=" rounded-full mt-3">
              <Link href="/studio">Go to studio</Link>
            </Button>
          ) : (
            <SubscriptionButton
              onClick={onClick}
              disable={isPending || !isLoaded}
              isSubscribed={user.viewerSubscribed}
              className="mt-3"
            />
          )}
        </div>
      </div>
    </div>
  );
};
