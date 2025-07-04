import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClerk, useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { commentInsertSchema } from "@/db/schema";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface CommentFormProps {
  videoId: string;
  variant?: "comment" | "reply";
  onSuccess?: () => void;
  onCancel?: () => void;
  parentId?: string;
}

export const CommentForm = ({
  videoId,
  onSuccess,
  variant,
  onCancel,
  parentId,
}: CommentFormProps) => {
  const utils = trpc.useUtils();
  const clerk = useClerk();
  const create = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId });
      utils.comments.getMany.invalidate({ videoId, parentId }); //感觉不需要
      form.reset();
      toast.success("Comments added");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const commentInsertDB = commentInsertSchema.omit({ userId: true });
  // TODO:为什么不可以两处都不要userId
  const form = useForm<z.infer<typeof commentInsertDB>>({
    resolver: zodResolver(commentInsertDB), //userId不是表单提交的，需要省略,后端操作的时候直接加上
    defaultValues: {
      parentId: parentId,
      videoId: videoId,
      value: "",
    },
  });
  const handleSubmit = (values: z.infer<typeof commentInsertDB>) => {
    console.log(values.videoId);
    create.mutate(values);
  };
  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };
  const { user } = useUser();
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex gap-4 group"
      >
        <UserAvatar
          size="lg"
          imageUrl={user?.imageUrl || "/user-placeholder.svg"}
          name={user?.username || "User"}
        />
        <div className="flex-1 ">
          <div>
            <FormField
              name="value"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={
                        variant === "reply"
                          ? "Add a reply to the comment"
                          : "Add a comment..."
                      }
                      className="resize-none min-h-0  bg-transparent overflow-hidden"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end gap-2 mt-2 ">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className=""
              >
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" disabled={create.isPending}>
              {variant === "reply" ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
