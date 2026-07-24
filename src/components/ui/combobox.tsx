"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string; subLabel?: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between font-medium min-h-[2.5rem] h-auto py-2 px-3",
          className
        )}
      >
        <span className="text-left text-xs whitespace-normal break-words leading-tight line-clamp-2">
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white shadow-xl border border-slate-200" align="start">
        <Command className="bg-white">
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList className="bg-white max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                {emptyMessage}
            </CommandEmpty>
            <CommandGroup className="bg-white p-1">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label + " " + (option.subLabel || "")}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center w-4">
                    {value === option.value && <Check className="h-3.5 w-3.5 text-primary stroke-[3px]" />}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-slate-700 text-xs whitespace-normal break-words leading-tight">{option.label}</span>
                    {option.subLabel && (
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight whitespace-normal break-words mt-0.5">{option.subLabel}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
