import { UserSection } from "../../sections/user-section";
import { VideosSection } from "../../sections/videos-section";

interface UserViewProps {
  userId: string;
}

export const UserView = ({ userId }: UserViewProps) => {
  return (
    <div className="flex flex-col mx-auto max-w-[1300px] px-4 pt-2.5 mb-10 gap-y-6">
      <UserSection userId={userId} />
      <VideosSection userId={userId} />
    </div>
  );
};
