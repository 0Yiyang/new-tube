"use client";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { StudioUploader } from "./studio-uploader";

export const StudioUploadModal = () => {
  const utils = trpc.useUtils();
  const create = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success("Create video successfull");
      // TODO:重新验证资源
      utils.studio.getMany.invalidate();
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });
  return (
    <>
      <ResponsiveModal
        title="Upload a video"
        open={!!create.data?.url}
        // 当用户关闭模态框时，重置 create 的状态，(才能关闭模态框)以便下次打开模态框时是一个干净的状态。
        // 当 create.data 有值时，模态框显示。
        // 当用户关闭模态框时，onOpenChange 被触发，调用 create.reset() 重置状态，模态框隐藏
        onOpenChange={() => create.reset()}
      >
        {create.data?.url ? (
          <StudioUploader endpoint={create.data.url} onSuccess={() => {}} />
        ) : (
          <Loader2Icon className="animate-spin" />
        )}
      </ResponsiveModal>
      <Button
        variant="secondary"
        onClick={() => create.mutate()}
        disabled={create.isPending}
      >
        {create.isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <PlusIcon />
        )}
        Create
      </Button>
    </>
  );
};
