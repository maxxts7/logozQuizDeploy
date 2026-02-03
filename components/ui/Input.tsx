import { forwardRef, InputHTMLAttributes } from "react"
import { cn } from "@/constants/theme"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full px-3.5 py-2.5 text-[15px]",
          "bg-white border border-slate-200 rounded-lg",
          "text-slate-900 placeholder:text-slate-400",
          "transition-all duration-150",
          "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          "hover:border-slate-300",
          "disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
