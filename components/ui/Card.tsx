import { HTMLAttributes, forwardRef } from "react"
import { cn } from "@/constants/theme"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: "none" | "sm" | "md" | "lg"
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, padding = "md", children, ...props }, ref) => {
    const paddingStyles = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-xl border border-slate-200 shadow-sm",
          "transition-shadow duration-150",
          hover && "hover:shadow-md",
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = "Card"

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mb-4", className)}
        {...props}
      />
    )
  }
)

CardHeader.displayName = "CardHeader"

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-xl font-semibold text-slate-900", className)}
        {...props}
      />
    )
  }
)

CardTitle.displayName = "CardTitle"

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-slate-500 mt-1", className)}
        {...props}
      />
    )
  }
)

CardDescription.displayName = "CardDescription"

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)

CardContent.displayName = "CardContent"

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-4 pt-4 border-t border-slate-100", className)}
        {...props}
      />
    )
  }
)

CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
