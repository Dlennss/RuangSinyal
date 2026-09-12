import { forwardRef, type ButtonHTMLAttributes } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#168AF2] text-white shadow-[0_10px_20px_rgba(215,7,23,0.18)] hover:bg-[#b80616]",
        primary: "bg-[#168AF2] text-white shadow-[0_10px_20px_rgba(215,7,23,0.18)] hover:bg-[#b80616]",
        danger: "bg-sky-600 text-white shadow-sm hover:bg-sky-500",
        warning: "bg-cyan-400 text-slate-950 shadow-sm hover:bg-cyan-300",
        success: "bg-[#16a34a] text-white shadow-sm hover:bg-[#15803d]",
        info: "bg-[#21D5ED] text-white shadow-sm hover:bg-[#ea580c]",
        destructive:
          "bg-sky-600 text-white shadow-sm hover:bg-sky-500",
        outline:
          "border-2 border-[#168AF2] bg-white text-[#168AF2] shadow-sm hover:bg-sky-50",
        secondary:
          "border border-sky-100 bg-sky-50 text-[#168AF2] shadow-sm hover:bg-sky-100",
        ghost: "text-[#168AF2] hover:bg-sky-50",
        link: "text-[#168AF2] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
