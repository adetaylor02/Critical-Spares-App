import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/StatusBadge";
import { useApp } from "@/lib/store";
import { SITES, type Site, type SystemCategory, type Criticality, type Condition } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/import")({ component: ImportPage });

const CATEGORIES: SystemCategory[] = ["UPS","PDU","Switchgear","Generator","ATS","Chiller","CRAH","Fire Alarm","BMS","Controls","Network","Other"];
const CRITICALITIES: Criticality[] = ["Critical","High","Medium","Low"];
const CONDITIONS: Condition[] = ["New","Good","Needs Inspection","Damaged","Obsolete"];

const REQUIRED = ["site","partName","manufacturer","modelNumber","category","criticality","minStock","quantity","unitCost","location","supplier"] as const;

type ParsedRow = Record<string, string | number | undefined>;
type ValidatedRow = {
  row: number;
  data: Omit<import("@/lib/types").SparePart, "id" | "createdAt" | "documents">;
  errors: string[];
  warnings: string[];
};

function downloadTemplate() {
  const headers = [
    "site","partName","description","manufacturer","modelNumber","serialNumber",
    "category","criticality","minStock","quantity","unitCost","location","bin",
    "supplier","leadTimeDays","condition","equipmentSupported","notes","expiryDate",
  ];
  const sample = [
    "CHI05","UPS Battery Module 12V/9Ah","VRLA battery","Schneider Electric","GVSBT9","SN-0001",
    "UPS","Critical",20,8,185,"loc-2","Shelf B-12",
    "sup-1",14,"Good","eq-1;eq-2","Sample row","",
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Spares");
  XLSX.writeFile(wb, "critical-spares-import-template.xlsx");
}

function ImportPage() {
  const locations = useApp((s) => s.locations);
  const suppliers = useApp((s) => s.suppliers);
  const equipment = useApp((s) => s.equipment);
  const bulkImportSpares = useApp((s) => s.bulkImportSpares);

  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [mode, setMode] = useState<"skip" | "update" | "new">("skip");
  const [result, setResult] = useState<{ batchId: string; imported: number; updated: number; skipped: number } | null>(null);

  const locIds = new Set(locations.map((l) => l.id));
  const supIds = new Set(suppliers.map((s) => s.id));
  const eqIds = new Set(equipment.map((e) => e.id));
  const siteSet = new Set<string>(SITES as readonly string[]);

  function validateRow(r: ParsedRow, idx: number): ValidatedRow {
    const errors: string[] = [];
    const warnings: string[] = [];
    const get = (k: string) => (r[k] === undefined || r[k] === "" ? undefined : String(r[k]).trim());

    REQUIRED.forEach((k) => { if (get(k) === undefined) errors.push(`Missing ${k}`); });
    const site = get("site");
    if (site && !siteSet.has(site)) errors.push(`Unknown site "${site}"`);
    const category = get("category");
    if (category && !CATEGORIES.includes(category as SystemCategory)) errors.push(`Invalid category "${category}"`);
    const criticality = get("criticality");
    if (criticality && !CRITICALITIES.includes(criticality as Criticality)) errors.push(`Invalid criticality "${criticality}"`);
    const condition = (get("condition") ?? "Good") as Condition;
    if (!CONDITIONS.includes(condition)) errors.push(`Invalid condition "${condition}"`);

    const location = get("location");
    if (location && !locIds.has(location)) warnings.push(`Unknown location "${location}"`);
    const supplier = get("supplier");
    if (supplier && !supIds.has(supplier)) warnings.push(`Unknown supplier "${supplier}"`);

    const eqRaw = get("equipmentSupported") ?? "";
    const equipmentSupported = eqRaw ? eqRaw.split(/[;,|]/).map((s) => s.trim()).filter(Boolean) : [];
    equipmentSupported.forEach((id) => { if (!eqIds.has(id)) warnings.push(`Unknown equipment "${id}"`); });

    const num = (k: string, def = 0) => {
      const v = r[k];
      if (v === undefined || v === "") return def;
      const n = Number(v);
      if (Number.isNaN(n)) errors.push(`${k} is not a number`);
      return Number.isNaN(n) ? def : n;
    };

    return {
      row: idx + 2,
      errors,
      warnings,
      data: {
        site: (site as Site) ?? "Other",
        partName: get("partName") ?? "",
        description: get("description") ?? "",
        manufacturer: get("manufacturer") ?? "",
        modelNumber: get("modelNumber") ?? "",
        serialNumber: get("serialNumber"),
        equipmentSupported,
        category: (category as SystemCategory) ?? "Other",
        criticality: (criticality as Criticality) ?? "Medium",
        minStock: num("minStock"),
        quantity: num("quantity"),
        unitCost: num("unitCost"),
        location: location ?? "",
        bin: get("bin") ?? "",
        supplier: supplier ?? "",
        leadTimeDays: num("leadTimeDays", 14),
        condition,
        notes: get("notes"),
        expiryDate: get("expiryDate"),
      },
    };
  }

  async function onFile(f: File) {
    setFileName(f.name);
    setResult(null);
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: "" });
    setRows(parsed.map(validateRow));
  }

  const validRows = rows.filter((r) => r.errors.length === 0);
  const errorRows = rows.filter((r) => r.errors.length > 0);

  function commit() {
    if (validRows.length === 0) { toast.error("No valid rows to import"); return; }
    const res = bulkImportSpares(validRows.map((r) => r.data), mode);
    setResult(res);
    toast.success(`Import ${res.batchId}: ${res.imported} new, ${res.updated} updated, ${res.skipped} skipped`);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bulk Import</h1>
        <p className="text-sm text-muted-foreground">Upload an Excel (.xlsx) or CSV file to add or update spare parts in bulk.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Upload file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
            />
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />Choose file
            </Button>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />Download template
            </Button>
            {fileName && (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />{fileName}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">2. Review &amp; commit</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Duplicate handling:</span>
              <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip duplicates</SelectItem>
                  <SelectItem value="update">Update duplicates</SelectItem>
                  <SelectItem value="new">Create as new</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={commit} disabled={validRows.length === 0}>
                Commit {validRows.length} rows
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 text-sm">
              <Badge tone="success"><CheckCircle2 className="mr-1 h-3 w-3 inline" />{validRows.length} valid</Badge>
              {errorRows.length > 0 && (
                <Badge tone="danger"><AlertTriangle className="mr-1 h-3 w-3 inline" />{errorRows.length} with errors</Badge>
              )}
            </div>
            <div className="max-h-[480px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.row} className={r.errors.length ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-xs">{r.row}</TableCell>
                      <TableCell>{r.data.site}</TableCell>
                      <TableCell>{r.data.partName}</TableCell>
                      <TableCell className="font-mono text-xs">{r.data.modelNumber}</TableCell>
                      <TableCell>{r.data.quantity}</TableCell>
                      <TableCell>
                        {r.errors.length > 0 ? (
                          <span className="text-xs text-destructive">{r.errors.join("; ")}</span>
                        ) : r.warnings.length > 0 ? (
                          <span className="text-xs text-amber-600 dark:text-amber-400">{r.warnings.join("; ")}</span>
                        ) : (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">OK</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader><CardTitle className="text-base">Import {result.batchId}</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p>{result.imported} new · {result.updated} updated · {result.skipped} skipped</p>
            <p className="text-muted-foreground mt-1">Logged to Audit Trail (filter by batch id).</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
