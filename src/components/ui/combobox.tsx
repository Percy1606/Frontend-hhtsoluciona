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

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between font-normal min-h-[2.5rem] h-auto py-2 px-3 bg-white border-slate-200 text-left hover:bg-slate-50 transition-colors",
          className
        )}
      >
        <div className="flex flex-col min-w-0 flex-1 pr-2">
          <span className="text-xs text-slate-800 font-medium whitespace-normal break-words leading-snug">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.subLabel && (
            <span className="text-[10px] text-slate-500 font-normal mt-0.5 whitespace-normal break-words">
              {selectedOption.subLabel}
            </span>
          )}
        </div>
        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width,100%)] min-w-[320px] max-w-[700px] p-0 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden overflow-x-hidden" 
        align="start"
      >
        <Command className="bg-white w-full overflow-x-hidden">
          <CommandInput placeholder={searchPlaceholder} className="h-9 text-xs border-b border-slate-100" />
          <CommandList className="bg-white max-h-[280px] overflow-y-auto overflow-x-hidden p-1">
            <CommandEmpty className="py-6 text-center text-xs text-slate-500 font-medium">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup className="bg-white p-0 space-y-0.5">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label + " " + (option.subLabel || "")}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100/80 data-[selected=true]:bg-slate-100 transition-colors border-b border-slate-50 last:border-b-0"
                >
                  <div className="flex items-center justify-center w-4 pt-0.5 shrink-0">
                    {value === option.value && <Check className="h-3.5 w-3.5 text-primary stroke-[3px]" />}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                    <span className="font-semibold text-slate-800 text-xs whitespace-normal break-words leading-relaxed">
                      {option.label}
                    </span>
                    {option.subLabel && (
                      <span className="text-[10px] text-slate-500 font-medium whitespace-normal break-words leading-tight mt-0.5">
                        {option.subLabel}
                      </span>
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
