import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            'gradient-primary text-primary-foreground hover:opacity-90': variant === 'default',
            'bg-surface-muted text-foreground hover:bg-surface-hover': variant === 'secondary',
            'border border-border bg-transparent text-foreground hover:bg-surface-hover': variant === 'outline',
            'text-foreground hover:bg-surface-hover': variant === 'ghost',
            'bg-danger text-danger-foreground hover:bg-danger-hover': variant === 'destructive',
          },
          {
            'h-10 px-4 py-2 text-sm': size === 'default',
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-8 text-base': size === 'lg',
            // Square icon button. 44px on touch to clear the minimum target
            // size, tightened to 36px once there is a mouse pointer.
            'h-11 w-11 shrink-0 p-0 md:h-9 md:w-9': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }