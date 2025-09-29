import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] dark:from-slate-700 dark:via-slate-600 dark:to-slate-700",
        className
      )}
      style={{
        animation: "shimmer 2s ease-in-out infinite",
      }}
      {...props}
    />
  )
}

export { Skeleton }