import { forwardRef, LabelHTMLAttributes } from "react"
import { cn } from "@/constants/theme"

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1.5",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )
  }
)

Label.displayName = "Label"

export { Label }
