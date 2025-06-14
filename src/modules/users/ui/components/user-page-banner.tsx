import { cn } from "@/lib/utils";
import { UserGetOntOutput } from "../../types";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Edit2Icon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BannerUploadModal } from "./banner-upload-modal";
import { useState } from "react";

interface UserPageBannerProps {
  user: UserGetOntOutput;
}
export const UserPageBannerSkeleton = () => {
  return <Skeleton className="w-full max-h-[200px] h-[15vh] md:h-[25vh]" />;
};
export const UserPageBanner = ({ user }: UserPageBannerProps) => {
  const { userId } = useAuth(); //用户
  const [isBannerUploadModalOpen, setIsBannerUploadModalOpen] = useState(false);
  return (
    <div className="relative group">
      <BannerUploadModal
        userId={user.id}
        open={isBannerUploadModalOpen}
        onOpenChange={setIsBannerUploadModalOpen}
      />
      <div
        className={cn(
          "w-full max-h-[200px] h-[15vh] md:h-[25vh] bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl",
          user.bannerUrl ? "bg-cover bg-center" : "bg-gray-100"
        )}
        style={{
          backgroundImage: user.bannerUrl
            ? `url(${user.bannerUrl})`
            : undefined,
        }}
      >
        {/* 是自己的页面 */}
        {user.clerkId === userId && (
          <Button
            type="button"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/60 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={() => setIsBannerUploadModalOpen(true)}
          >
            {/* opacity-0  透明    */}
            <Edit2Icon />
          </Button>
        )}
      </div>
    </div>
  );
};
