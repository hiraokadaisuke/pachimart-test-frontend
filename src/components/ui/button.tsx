import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

    const styles: Record<ButtonVariant, string> = {
      default: "bg-blue-600 text-white shadow hover:bg-blue-700",
      outline:
        "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
      ghost: "text-slate-700 hover:bg-slate-100",
    };

    return (
      <button
        ref={ref}
        className={cn(base, styles[variant], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
