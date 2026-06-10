import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  data: string;
  rule: string;
  fallback: string;
  label?: string;
}

export function WhyThisPopover({ data, rule, fallback, label = "Why this?" }: Props) {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200">
        <Info className="h-3 w-3" aria-hidden="true" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs" align="start">
        <div className="space-y-2">
          <div>
            <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Data</p>
            <p className="text-slate-700">{data}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Rule</p>
            <p className="text-slate-700">{rule}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Fallback</p>
            <p className="text-slate-700">{fallback}</p>
          </div>
          <p className="border-t border-slate-200 pt-2 text-[10px] italic text-slate-500">
            AI explains. Rules decide. Humans approve.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
