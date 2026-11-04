"use client";

import { CheckIcon } from "lucide-react";
import { DropdownMenu as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuRadioGroup = Primitive.RadioGroup;
export const DropdownMenuSeparator = () => <Primitive.Separator className="my-1 h-px bg-border" />;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        className={cn("z-50 min-w-52 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md", className)}
        {...props}
      />
    </Primitive.Portal>
  );
}

const itemStyle =
  "relative flex cursor-pointer items-center rounded-lg py-2 pr-3 pl-8 text-sm outline-none select-none data-[highlighted]:bg-muted";

function ItemIndicator() {
  return (
    <Primitive.ItemIndicator className="absolute left-2.5">
      <CheckIcon className="size-4" />
    </Primitive.ItemIndicator>
  );
}

export function DropdownMenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof Primitive.CheckboxItem>) {
  return (
    <Primitive.CheckboxItem className={cn(itemStyle, className)} {...props}>
      <ItemIndicator />
      {children}
    </Primitive.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof Primitive.RadioItem>) {
  return (
    <Primitive.RadioItem className={cn(itemStyle, className)} {...props}>
      <ItemIndicator />
      {children}
    </Primitive.RadioItem>
  );
}
