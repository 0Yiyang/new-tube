import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubscriptionButtonProps {
  onClick: ButtonProps["onClick"];
  disable: boolean;
  isSubscribed: boolean;
  className?: string;
  size?: ButtonProps["size"];
}
export const SubscriptionButton = ({
  onClick,
  disable,
  isSubscribed,
  className,
  size,
}: SubscriptionButtonProps) => {
  return (
    <Button
      size={size}
      disabled={disable}
      variant={isSubscribed ? "secondary" : "default"}
      onClick={onClick}
      className={cn("rounded-full", className)}
    >
      {isSubscribed ? "Unsubscribe" : "Subscribe"}
    </Button>
  );
};
