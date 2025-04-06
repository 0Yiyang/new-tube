import Link from "next/link";
import { VideoGetOneOutput } from "../../types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { UserAvatar } from "@/components/user-avatar";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { useSubscription } from "@/modules/subscriptions/hooks/use-subscription";

interface VideoOwnerProps {
  user: VideoGetOneOutput["user"];
  videoId: VideoGetOneOutput["id"];
}
export const VideoOwner = ({ user, videoId }: VideoOwnerProps) => {
  const { userId: ClerkUserId, isLoaded } = useAuth();
  const { isPending, onClick } = useSubscription({
    userId: user.id,
    isSubscribed: user.viewerSubscribed,
    fromVideoId: videoId,
  });
  return (
    // TODO:min-w-0
    <div className="flex items-center justify-between sm:items-start sm:justify-start gap-3 min-w-0 ">
      <Link href={`/users/${user.id}`}>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar imageUrl={user.imageUrl} name={user.name} size="lg" />
          {/* TODO:min-w-0是干什么的 */}
          <div className="flex flex-col gap-1 min-w-0">
            <UserInfo name={user.name} size="lg" />
            <span className="text-sm text-muted-foreground line-clamp-1">
              {user.subscriberCount} subscribers
            </span>
          </div>
        </div>
      </Link>
      {ClerkUserId === user.clerkId ? (
        <Button variant="secondary" className="rounded-full" asChild>
          <Link href={`/studio/videos/${videoId}`}>Edit video</Link>
        </Button>
      ) : (
        <SubscriptionButton
          onClick={onClick}
          disable={isPending || !isLoaded}
          isSubscribed={user.viewerSubscribed}
          className={"flex-none"}
        />
      )}
    </div>
  );
};
