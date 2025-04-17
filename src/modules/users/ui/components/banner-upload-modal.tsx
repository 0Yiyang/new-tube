import { ResponsiveModal } from "@/components/responsive-modal";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";

interface BannerUploadModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const BannerUploadModal = ({
  userId,
  open,
  onOpenChange,
}: BannerUploadModalProps) => {
  const utils = trpc.useUtils(); //TODO:useutils是trpc包装的hook
  const onUploadComplete = () => {
    // 上传完成并同步到数据库之后，自动关闭模态框，
    utils.users.getOne.invalidate({ id: userId });
    onOpenChange(false);
  };
  return (
    <ResponsiveModal
      title="Upload a banner"
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* endpoint就是接口 */}
      <UploadDropzone
        endpoint="bannerUploader"
        onClientUploadComplete={onUploadComplete}
      />
    </ResponsiveModal>
  );
};
