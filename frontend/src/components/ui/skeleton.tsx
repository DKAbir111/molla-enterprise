import { cn } from '@/lib/utils'

/**
 * Placeholder for content that is still loading. Uses surface tokens so it
 * themes automatically.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-hover', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }
