import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

interface useSubscriptionProps {
  userId: string;
  isSubscribed: boolean;
  fromVideoId?: string; //从视频播放页订阅，就会立即验证视频getOne
}

export const useSubscription = ({
  userId,
  isSubscribed,
  fromVideoId,
}: useSubscriptionProps) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();
  // 重新验证资源
  const subscribe = trpc.subscriptions.create.useMutation({
    onSuccess: () => {
      toast.success("Subscribed");
      //TODO: 重新验证 subscriptions.getMany,users.getOne
      if (fromVideoId) {
        utils.videos.getOne.invalidate({ id: fromVideoId });
      }
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });
  const unsubscribe = trpc.subscriptions.remove.useMutation({
    onSuccess: () => {
      toast.success("Unsubscribed");
      //TODO: 重新验证 subscriptions.getMany,users.getOne
      if (fromVideoId) {
        utils.videos.getOne.invalidate({ id: fromVideoId });
      }
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const isPending = subscribe.isPending || unsubscribe.isPending;
  // 如果没有登陆，先登录

  const onClick = () => {
    if (isSubscribed) {
      unsubscribe.mutate({ userId });
    } else {
      subscribe.mutate({ userId });
    }
  };
  return {
    isPending,
    onClick,
  };
};
