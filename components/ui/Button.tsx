import { forwardRef, ButtonHTMLAttributes } from "react"
import { cn } from "@/constants/theme"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

const variantStyles = {
  primary:
    "bg-blue-600 bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800",
  secondary:
    "bg-white text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger:
    "bg-red-600 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800",
  success:
    "bg-emerald-600 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm hover:from-emerald-600 hover:to-emerald-700",
  outline:
    "bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50 active:bg-blue-100",
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
