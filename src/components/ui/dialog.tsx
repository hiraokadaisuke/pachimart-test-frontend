"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  overlayClassName?: string;
};

export function Dialog({ open, onOpenChange, children, overlayClassName }: DialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm", overlayClassName)}>
      <div
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
        {children}
      </div>
    </div>,
    document.body,
  );
}

type DialogContentProps = {
  className?: string;
  children: React.ReactNode;
};

export function DialogContent({ className, children }: DialogContentProps) {
  return (
    <div className={cn("w-full max-w-2xl rounded-2xl bg-white shadow-xl", className)}>{children}</div>
  );
}

type DialogHeaderProps = { children: React.ReactNode; className?: string };
export function DialogHeader({ children, className }: DialogHeaderProps) {
  return <div className={cn("border-b border-slate-200 px-6 py-4", className)}>{children}</div>;
}

type DialogTitleProps = { children: React.ReactNode; className?: string };
export function DialogTitle({ children, className }: DialogTitleProps) {
  return <h2 className={cn("text-lg font-semibold text-slate-900", className)}>{children}</h2>;
}

type DialogDescriptionProps = { children: React.ReactNode; className?: string };
export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return <p className={cn("text-sm text-neutral-800", className)}>{children}</p>;
}

type DialogFooterProps = { children: React.ReactNode; className?: string };
export function DialogFooter({ children, className }: DialogFooterProps) {
  return <div className={cn("flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4", className)}>{children}</div>;
}
