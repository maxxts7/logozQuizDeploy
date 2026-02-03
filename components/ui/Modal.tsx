"use client"

import { HTMLAttributes, forwardRef, useEffect } from "react"
import { cn } from "@/constants/theme"

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, open, onClose, size = "md", children, ...props }, ref) => {
    // Handle escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose()
        }
      }

      if (open) {
        document.addEventListener("keydown", handleEscape)
        document.body.style.overflow = "hidden"
      }

      return () => {
        document.removeEventListener("keydown", handleEscape)
        document.body.style.overflow = ""
      }
    }, [open, onClose])

    if (!open) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal content */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative bg-white rounded-2xl shadow-xl w-full",
            "max-h-[90vh] overflow-hidden",
            "animate-fade-in",
            sizeStyles[size],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)

Modal.displayName = "Modal"

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-4 border-b border-slate-200",
          "flex items-center justify-between",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalHeader.displayName = "ModalHeader"

interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn("text-xl font-semibold text-slate-900", className)}
        {...props}
      />
    )
  }
)

ModalTitle.displayName = "ModalTitle"

interface ModalCloseProps extends HTMLAttributes<HTMLButtonElement> {
  onClose: () => void
}

const ModalClose = forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ className, onClose, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClose}
        className={cn(
          "text-slate-400 hover:text-slate-500 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg p-1",
          className
        )}
        {...props}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )
  }
)

ModalClose.displayName = "ModalClose"

interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {}

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-y-auto p-6", className)}
        {...props}
      />
    )
  }
)

ModalBody.displayName = "ModalBody"

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {}

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-4 border-t border-slate-200",
          "flex items-center justify-end gap-3",
          className
        )}
        {...props}
      />
    )
  }
)

ModalFooter.displayName = "ModalFooter"

export { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter }
