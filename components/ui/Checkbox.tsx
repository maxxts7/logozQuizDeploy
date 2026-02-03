import { forwardRef, InputHTMLAttributes } from "react"
import { cn } from "@/constants/theme"

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputElement = (
      <input
        type="checkbox"
        ref={ref}
        id={id}
        className={cn(
          "w-4 h-4 text-blue-600 border-slate-300 rounded",
          "focus:ring-2 focus:ring-blue-500/50",
          "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )

    if (label) {
      return (
        <label className="flex items-center gap-2 cursor-pointer" htmlFor={id}>
          {inputElement}
          <span className="text-sm text-slate-700">{label}</span>
        </label>
      )
    }

    return inputElement
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
