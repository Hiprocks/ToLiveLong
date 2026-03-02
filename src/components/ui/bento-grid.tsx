import { cn } from "@/lib/utils";

type DivProps = React.ComponentProps<"div">;

export function BentoGrid({ className, ...props }: DivProps) {
  return <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-6", className)} {...props} />;
}

export function BentoCard({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card shadow-sm backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}
