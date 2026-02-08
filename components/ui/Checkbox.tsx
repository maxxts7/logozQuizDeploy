"use client"

import { forwardRef, InputHTMLAttributes, useState } from "react"
import { cn } from "@/constants/theme"

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  icon?: React.ReactNode
  tooltip?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, icon, tooltip, id, ...props }, ref) => {
    const [showTooltip, setShowTooltip] = useState(false)

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
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer" htmlFor={id}>
            {inputElement}
            {icon && <span className="text-slate-400 flex-shrink-0">{icon}</span>}
            <span className="text-sm text-slate-700">{label}</span>
          </label>
          {tooltip && (
            <div
              className="relative flex-shrink-0"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <svg className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                  {tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    return inputElement
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
