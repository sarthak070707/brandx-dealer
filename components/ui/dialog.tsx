"use client";

import { XIcon } from "lucide-react";
import { Dialog as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

// Adapted from a 21st.dev dialog: same structure, without the blurred backdrop.
export function DialogContent({ className, children, ...props }: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <Primitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-2xl border bg-card p-6 shadow-lg motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <Primitive.Close className="absolute top-4 right-4 rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          <XIcon className="size-5" />
          <span className="sr-only">Close</span>
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export const DialogHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex flex-col gap-1.5 pr-8", className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
);

export const DialogTitle = ({ className, ...props }: ComponentProps<typeof Primitive.Title>) => (
  <Primitive.Title className={cn("text-xl", className)} {...props} />
);

export const DialogDescription = ({ className, ...props }: ComponentProps<typeof Primitive.Description>) => (
  <Primitive.Description className={cn("text-muted-foreground", className)} {...props} />
);
