import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, onChange, onFocus, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      let v = e.currentTarget.value
      // Sanitize leading zeros: "0123" -> "123", "00.5" -> "0.5"
      if (v && !v.startsWith('0.') ) {
        v = v.replace(/^0+(?=\d)/, '') // strip leading zeros when followed by digits
        if (/^0+$/.test(v)) v = '0'
      }
      // Special case: normalize multiple leading zeros before a dot
      if (/^0+\./.test(v)) {
        v = v.replace(/^0+\./, '0.')
      }
      e.currentTarget.value = v
    }
    onChange?.(e)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number') {
      try { e.currentTarget.select() } catch {}
    }
    onFocus?.(e)
  }

  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      onChange={handleChange}
      onFocus={handleFocus}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
