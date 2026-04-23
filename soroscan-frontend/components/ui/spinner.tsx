import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader } from "lucide-react"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      variant: {
        default: "text-primary",
        success: "text-green-600 dark:text-green-500",
        warning: "text-yellow-600 dark:text-yellow-500",
        error: "text-red-600 dark:text-red-500",
      },
      size: {
        default: "size-6",
        mini: "size-4",
        large: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <Loader
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(spinnerVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }