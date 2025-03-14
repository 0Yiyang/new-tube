import { Button } from "@/components/ui/button";
import MuxUploader, {
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
  MuxUploaderStatus,
} from "@mux/mux-uploader-react";
import { UploadIcon } from "lucide-react";
interface StudioUploaderProps {
  endpoint?: string | null;
  onSuccess: () => void;
}
const UPLOADER_ID = "video-uploader";
export const StudioUploader = ({
  endpoint,
  onSuccess,
}: StudioUploaderProps) => {
  return (
    // TODO:为什么hidden
    <div>
      <MuxUploader
        onSuccess={onSuccess}
        endpoint={endpoint}
        id={UPLOADER_ID}
        className="hidden group/uploader"
      />
      <MuxUploaderDrop muxUploader={UPLOADER_ID} className="group/drop">
        {/* TODO:slot这里代表什么 group是什么 group/drop-[&[active]]:animate-bounce
        本来MuxUploaderDrop就有很多slot:heading,slot:separator，修改*/}
        <div slot="heading" className="flex flex-col items-center gap-6">
          <div className="flex items-center justify-center rounded-full gap-2 bg-muted h-32 w-32">
            <UploadIcon className="size-10 text-muted-foreground group/drop-[&[active]]:animate-bounce transition-all duration-300" />
          </div>
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm">Drag and drop video files yo upload</p>
            <p className="text-xs text-muted-foreground">
              Your videos will be private and until you publish them
            </p>
          </div>
          <MuxUploaderFileSelect muxUploader={UPLOADER_ID}>
            <Button type="button" className="rounded-full">
              Select your files
            </Button>
          </MuxUploaderFileSelect>
        </div>
        <div slot="separator" className="hidden" />
        <MuxUploaderStatus muxUploader={UPLOADER_ID} className="text-sm" />
        <MuxUploaderProgress
          muxUploader={UPLOADER_ID}
          className="text-sm"
          type="percentage"
        />
        <MuxUploaderProgress muxUploader={UPLOADER_ID} type="bar" />
      </MuxUploaderDrop>
    </div>
  );
};
