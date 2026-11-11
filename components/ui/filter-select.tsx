
"use client";

import * as React from "react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

type Option = {
    value: string;
    label: string;
};

type FilterSelectProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: Option[];
    className?: string;
    contentClassName?: string;
};

export function FilterSelect({
    value,
    onChange,
    placeholder,
    options,
    className,
    contentClassName,
}: FilterSelectProps) {
    return (
        <Select
            value={value}
            onValueChange={(nextValue) => onChange(nextValue ?? "")}
        >
            <SelectTrigger
                className={cn(
                    "h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-4 text-sm font-medium text-[#334155] shadow-sm transition-all duration-200",
                    "hover:border-[#93c5fd]",
                    "focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-100",
                    "data-[state=open]:border-[#3b82f6] data-[state=open]:ring-2 data-[state=open]:ring-blue-100",
                    "[&>span]:truncate",
                    "data-[placeholder]:text-[#64748b]",
                    className
                )}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent
                side="bottom"
                sideOffset={6}
                align="start"
                className={cn(
                    "z-50 min-w-[220px]",
                    "rounded-xl border border-[#dbe4f0]",
                    "bg-white p-1.5",
                    "shadow-[0_8px_24px_rgba(15,23,42,0.12)]",
                    contentClassName
                )}
            >
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        className={cn(
                            "relative flex min-h-[38px] cursor-pointer items-center rounded-lg px-3 py-2 text-[13px] font-medium text-[#334155] outline-none transition-colors duration-150",
                            "focus:bg-[#eff6ff] focus:text-[#1d4ed8]",
                            "data-[highlighted]:bg-[#eff6ff] data-[highlighted]:text-[#1d4ed8]",
                            "aria-selected:bg-[#dbeafe] aria-selected:text-[#1d4ed8] aria-selected:font-semibold"
                        )}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
