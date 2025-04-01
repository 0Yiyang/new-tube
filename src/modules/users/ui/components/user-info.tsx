import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const userInfoVariants = cva("flex items-center gap-1", {
  variants: {
    size: {
      default: "[&_p]:text-sm [&_svg]:size-4",
      lg: "[&_p]:text-base [&_svg]:size-5 [&_p]:font-medium [&_p]:text-black",
      sm: "[&_p]:text-xs [&_svg]:size-3.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});
interface UserInfoProps extends VariantProps<typeof userInfoVariants> {
  name: string;
  className?: string;
}
export const UserInfo = ({ size, name, className }: UserInfoProps) => {
  return (
    <div className={cn(userInfoVariants({ className, size }))}>
      <Tooltip>
        {/* TODO:asChild 直接将其行为和属性传递给它的唯一子元素， */}
        {/* 被截断的时候有用 */}
        <TooltipTrigger asChild>
          <p className="text-gray-500 hover:text-gray-800 line-clamp-1">
            {name}
          </p>
        </TooltipTrigger>
        <TooltipContent align="center" className="bg-black/70">
          <p>{name}</p>
        </TooltipContent>
        {/* content是被触发的内容 */}
      </Tooltip>
    </div>
  );
};
