import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ProductMark } from "./ui/product-ui";

export default function ModelProviderMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Choose AI model. Current model: Repnex AI"
          className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border/70 bg-muted/55 px-2.5 text-[11px] font-semibold text-foreground/85 transition-colors hover:border-primary/25 hover:bg-primary/8 hover:text-foreground"
        >
          <ProductMark className="h-4 w-4" />
          <span>Repnex AI</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-56 rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Model provider
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="rounded-lg px-2.5 py-2.5">
          <ProductMark className="h-7 w-7" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-foreground">Repnex AI</span>
            <span className="block text-[10px] text-muted-foreground">Default model</span>
          </span>
          <Check className="h-4 w-4 text-primary" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
