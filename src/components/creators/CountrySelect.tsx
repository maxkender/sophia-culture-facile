import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { countryNames } from "@/config/countries";
import { cn } from "@/lib/utils";

export function CountrySelect({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const names = useMemo(() => countryNames(), []);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} className="h-11 w-full justify-between font-normal">
          <span className={value ? "" : "text-muted-foreground"}>{value || "Select your country"}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search a country…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {names.map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2", value === name ? "opacity-100" : "opacity-0")} />
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
