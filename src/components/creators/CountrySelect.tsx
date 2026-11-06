import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { countryNames, countryOptions } from "@/config/countries";
import { cn } from "@/lib/utils";

export function CountrySelect({ id, value, onChange, lang, labels, displayLocale }: { id?: string; value: string; onChange: (v: string) => void; lang: "fr" | "en"; labels: { select: string; search: string; empty: string }; displayLocale?: string | undefined }) {
  const [open, setOpen] = useState(false);
  const options = useMemo(
    () => (displayLocale ? countryOptions(lang, displayLocale) : countryNames(lang).map((n) => ({ value: n, label: n }))),
    [lang, displayLocale],
  );
  const current = options.find((o) => o.value === value)?.label ?? value;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} className="h-11 w-full justify-between font-normal">
          <span className={value ? "" : "text-muted-foreground"}>{current || labels.select}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={labels.search} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {options.map(({ value: name, label }) => (
                <CommandItem
                  key={name}
                  value={`${label} ${name}`}
                  onSelect={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("me-2", value === name ? "opacity-100" : "opacity-0")} />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
