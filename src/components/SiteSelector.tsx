import { Building2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { SITES, type SiteScope } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SiteSelector() {
  const selectedSite = useApp((s) => s.selectedSite);
  const setSelectedSite = useApp((s) => s.setSelectedSite);

  return (
    <Select value={selectedSite} onValueChange={(v) => setSelectedSite(v as SiteScope)}>
      <SelectTrigger className="h-9 w-[180px]" aria-label="Site selector">
        <Building2 className="mr-1 h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All CHI Metro">All CHI Metro</SelectItem>
        {SITES.map((s) => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
