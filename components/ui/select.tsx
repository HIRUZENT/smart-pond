
import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  CheckIcon,
  ChevronUpIcon,
} from "lucide-react";

const Select = SelectPrimitive.Root;

function SelectGroup({
  className,
  ...props
}: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({
  className,
  ...props
}: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn(
        "flex flex-1 items-center text-left",
        "truncate text-[#1f2937]",
        className
      )}
      {...props}
    />
  );
}


function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // Layout
        "flex w-full items-center justify-between gap-2",

        // Dimensions
        "h-11 px-4 py-2",

        // Appearance
        "rounded-xl border border-[#cbd5e1]",
        "bg-white shadow-sm",

        // Typography
        "text-sm font-medium text-[#1f2937]",
        "data-placeholder:text-[#64748b]",

        // Interaction
        "transition-all duration-200",
        "hover:border-[#93c5fd]",
        "focus-visible:border-[#3b82f6]",
        "focus-visible:ring-4 focus-visible:ring-blue-100",

        // Open state
        "data-[popup-open]:border-[#3b82f6]",
        "data-[popup-open]:ring-4",
        "data-[popup-open]:ring-blue-100",

        // Disabled
        "disabled:cursor-not-allowed",
        "disabled:opacity-60",

        // Icon
        "[&_svg]:pointer-events-none",
        "[&_svg]:shrink-0",
        "[&_svg]:size-4",
        "[&_svg]:text-[#64748b]",

        className
      )}
      {...props}
    >
      {children}

      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon
            className="size-4 text-[#64748b] transition-transform duration-200"
          />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            // Position and dimensions
            "relative isolate z-50",
            "w-[var(--anchor-width)]",
            "min-w-[180px]",
            "max-h-[var(--available-height)]",

            // Scroll
            "overflow-x-hidden overflow-y-auto",

            // Appearance
            "rounded-xl",
            "border border-[#dbe4f0]",
            "bg-white",
            "p-1.5",

            // Shadow
            "shadow-[0_8px_24px_rgba(15,23,42,0.12)]",

            // Typography
            "text-sm text-[#1f2937]",

            // Animation
            "origin-[var(--transform-origin)]",
            "duration-150",
            "data-open:animate-in",
            "data-open:fade-in-0",
            "data-open:zoom-in-95",
            "data-closed:animate-out",
            "data-closed:fade-out-0",
            "data-closed:zoom-out-95",

            className
          )}
          {...props}
        >
          <SelectScrollUpButton />

          <SelectPrimitive.List className="space-y-1">
            {children}
          </SelectPrimitive.List>

          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}


function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        "px-3 py-2",
        "text-xs font-semibold",
        "text-[#64748b]",
        className
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Layout
        "relative flex w-full items-center",
        "min-h-[40px] gap-2",
        "rounded-lg px-3 py-2 pr-9",

        // Typography
        "text-[13px] font-medium",
        "text-[#1f2937]",

        // Interaction
        "cursor-pointer select-none outline-none",
        "transition-colors duration-150",

        // Hover / highlighted
        "data-[highlighted]:bg-[#eff6ff]",
        "data-[highlighted]:text-[#1d4ed8]",

        // Selected
        "data-[selected]:bg-[#dbeafe]",
        "data-[selected]:text-[#1d4ed8]",
        "data-[selected]:font-semibold",

        // Disabled
        "data-disabled:pointer-events-none",
        "data-disabled:opacity-50",

        // Icons
        "[&_svg]:pointer-events-none",
        "[&_svg]:shrink-0",

        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText
        className="flex min-w-0 flex-1 items-center gap-2 truncate"
      >
        {children}
      </SelectPrimitive.ItemText>

      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-3 flex size-4 items-center justify-center text-[#2563eb]" />
        }
      >
        <CheckIcon className="size-4 stroke-[2.5]" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "-mx-1 my-1 h-px bg-[#e2e8f0]",
        className
      )}
      {...props}
    />
  );
}


function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<
  typeof SelectPrimitive.ScrollUpArrow
>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full",
        "cursor-default items-center justify-center",
        "bg-white py-1 text-[#64748b]",
        "[&_svg]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}


function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<
  typeof SelectPrimitive.ScrollDownArrow
>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full",
        "cursor-default items-center justify-center",
        "bg-white py-1 text-[#64748b]",
        "[&_svg]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
