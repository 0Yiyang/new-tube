import Link from "next/link";
import { VideoGetOneOutput } from "../../types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { UserAvatar } from "@/components/user-avatar";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { UserInfo } from "@/modules/users/ui/components/user-info";

interface VideoOwnerProps {
  user: VideoGetOneOutput["user"];
  videoId: VideoGetOneOutput["id"];
}
export const VideoOwner = ({ user, videoId }: VideoOwnerProps) => {
  const { userId: ClerkUserId } = useAuth();
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
              {/* TODO: fill count */}
              {0} subscribers
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
          onClick={() => {}}
          disable={false}
          isSubscribed={false}
          className={"flex-none"}
        />
      )}
    </div>
  );
};
