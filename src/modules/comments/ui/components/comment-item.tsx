import { CommentsGetManyOutput } from "../../types";
import Link from "next/link";
import { useState } from "react";

import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TrashIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentForm } from "./comment-form";
import { CommentReplies } from "./comment-replies";

interface CommentItemProps {
  comment: CommentsGetManyOutput[number]; //TODO:选这个，这里的schema是到时候自己选择<getMany>的返回值,getMany本来就返回一个数组
  // comment:z.infer<typeof commentInsertSchema>
  variant?: "comment" | "reply";
}

export const CommentItem = ({
  comment,
  variant = "comment",
}: CommentItemProps) => {
  const { userId } = useAuth();
  const clerk = useClerk();
  const utils = trpc.useUtils();
  const [isRelyOpen, setRelyOpen] = useState(false);
  const [isReliesOpen, setReliesOpen] = useState(false);
  const remove = trpc.comments.remove.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
      toast.success("Deleted successfully");
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });
  const dislike = trpc.commentReactions.dislike.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });
  const like = trpc.commentReactions.like.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId });
    },
    onError: (error) => {
      toast.error("Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });
  return (
    <div>
      <div className="flex gap-4">
        <Link href={`/users/${comment.userId}`}>
          <UserAvatar
            size={variant === "comment" ? "lg" : "sm"}
            imageUrl={comment.user.imageUrl || "/placeholder.svg"}
            name={comment.user.name}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/users/${comment.userId}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm pb-0.5">
                {comment.user.name}
              </span>
              <span className="text-muted-foreground text-xs pb-0.5">
                {formatDistanceToNow(comment.updatedAt, { addSuffix: true })}
              </span>
            </div>
          </Link>
          <p className="text-sm">{comment.value}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                className="size-8"
                variant="ghost"
                disabled={dislike.isPending || like.isPending}
                onClick={() => {
                  like.mutate({ commentId: comment.id });
                }}
              >
                <ThumbsUpIcon
                  className={cn(
                    comment.viewerReaction === "like" && "fill-black"
                  )}
                />
              </Button>
              <span className="text-muted-foreground text-xs">
                {comment.likeCount}
              </span>
              <Button
                size="icon"
                className="size-8"
                variant="ghost"
                disabled={dislike.isPending || like.isPending}
                onClick={() => {
                  dislike.mutate({ commentId: comment.id });
                }}
              >
                <ThumbsDownIcon
                  className={cn(
                    comment.viewerReaction === "dislike" && "fill-black"
                  )}
                />
              </Button>
              <span className="text-muted-foreground text-xs">
                {comment.dislikeCount}
              </span>
            </div>
            {variant === "comment" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setRelyOpen(true);
                }}
              >
                Reply
              </Button>
            )}
          </div>
        </div>
        {/* TODO:modal={false},不影响滚动条 */}
        {(variant === "comment" ||
          (variant === "reply" && comment.user.clerkId === userId)) && (
          <DropdownMenu modal={false}>
            {/* TODO: 避免嵌套按钮*/}
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {variant === "comment" && (
                <DropdownMenuItem
                  onClick={() => {
                    setRelyOpen(true);
                  }}
                >
                  <MessageSquareIcon className="size-4" />
                  Reply
                </DropdownMenuItem>
              )}
              {/* TODO:双重验证 ,procedure也验证了*/}
              {userId === comment.user.clerkId && (
                <DropdownMenuItem
                  onClick={() => remove.mutate({ id: comment.id })}
                >
                  <TrashIcon className="size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {isRelyOpen && variant === "comment" && (
        <div className="mt-4 pl-14">
          <CommentForm
            videoId={comment.videoId}
            variant="reply"
            parentId={comment.id}
            onCancel={() => setRelyOpen(false)}
            onSuccess={() => {
              setRelyOpen(false); //关闭form
              setReliesOpen(true); //回复之后就展开回复的信息
            }}
          />
        </div>
      )}
      {comment.replyCount > 0 && variant === "comment" && (
        <div className="pl-14">
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setReliesOpen((current) => !current)}
          >
            {isReliesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {comment.replyCount} replies
          </Button>
        </div>
      )}
      {comment.replyCount > 0 && variant === "comment" && isReliesOpen && (
        <CommentReplies videoId={comment.videoId} parentId={comment.id} />
      )}
    </div>
  );
};
