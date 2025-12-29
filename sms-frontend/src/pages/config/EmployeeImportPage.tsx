// src/pages/Config/EmployeeImportPage.tsx
import { useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
  FileUp,
  Loader2,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useEmployeesList, useImportEmployees } from "../../api/employees";

type ImportError = {
  row: number;
  emp_number?: string | null;
  error: string;
};

type ImportResult = {
  total_rows?: number;
  created: number;
  updated: number;
  failed?: number;
  errors?: ImportError[];
  preview?: any[];
};

type EmployeeRow = {
  id?: number | string;
  emp_number: string;
  name: string;
  short_name?: string | null;
  designation?: string | null;
  department?: string | null;
  employee_type?: string | null;
  contract_type?: string | null;
  nationality?: string | null;
  tel_number?: string | null;
  email_id?: string | null;
};

function norm(v: unknown) {
  return String(v ?? "").toLowerCase().trim();
}

function isAllowed(file: File) {
  const name = (file.name || "").toLowerCase();
  return name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".tsv");
}

function humanBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Must match backend HEADER_MAP keys */
const EMPLOYEE_TEMPLATE_HEADERS = [
  "Emp #",
  "Name",
  "Short Name",
  "Designation",
  "Nationality",
  "Date of Joining",
  "Grade",
  "Civil ID Number",
  "Civil ID Expiry Date",
  "Passport #",
  "Passport Expiry Date",
  "Visa Number",
  "Visa Issue Date",
  "Visa Expiry Date",
  "Date of Birth",
  "Age",
  "Blood Group",
  "Driving License",
  "DL Expiry Date",
  "Tel #",
  "Email ID",
  "Address",
  "Registered Bank Details",
  "Acc Number",
  "Employee Type",
  "Contract Type",
  "Department",
  "Leave Schedule",
  "Last Appraisal",
  "Benefits",
  "Graduation",
  "Specialization",
  "Year of Passing",
  "University",
  "Gender",
  "Marital Status",
  "Name of Spouse",
  "No. of Kids",
  "Name Kid 1",
  "Name Kid 2",
  "Emergency Contact Name",
  "Emergency Contact Relationship",
  "Emergency Contact Tel #",
  "Place of Birth",
];

function downloadEmployeeTemplateXlsx() {
  const exampleRow: Record<string, any> = {
    "Emp #": "TT-01",
    Name: "T. Santosh Kumar",
    "Short Name": "Santosh Kumar",
    Designation: "General Manager",
    Nationality: "Indian (Expat)",
    "Date of Joining": "15/May/19",
    Grade: "GM",
    "Civil ID Number": "61388021",
    "Civil ID Expiry Date": "02/Sep/22",
    "Passport #": "J3761244",
    "Passport Expiry Date": "18/Mar/30",
    "Visa Number": "TES / 135262/03",
    "Visa Issue Date": "03/Sep/20",
    "Visa Expiry Date": "02/Sep/22",
    "Date of Birth": "27/Apr/61",
    Age: "65",
    "Blood Group": "B +ve",
    "Driving License": "Private Light",
    "DL Expiry Date": "12/Mar/25",
    "Tel #": "+968 9932 4468",
    "Email ID": "Santosh.Kumar@task-target.com",
    Address: "Ruwi Rex Road, Kamat Bldg., Floor# 2, House# 21",
    "Registered Bank Details": "Bank Muscat, Ruwi",
    "Acc Number": "0337001675120011",
    "Employee Type": "Office Employee - PER",
    "Contract Type": "Open",
    Department: "Management",
    "Leave Schedule": "1 Year - 1 month",
    "Last Appraisal": "15/May/19",
    Benefits: "3 - Mobile, Internet, Fuel",
    Graduation: "Bachelors Degree",
    Specialization: "Chemical & Process Engineering",
    "Year of Passing": "2004",
    University: "California State Polytechnic University",
    Gender: "Male",
    "Marital Status": "Married",
    "Name of Spouse": "Poornima S K",
    "No. of Kids": "2",
    "Name Kid 1": "Cyril Sanket",
    "Name Kid 2": "Sanjeet Santosh",
    "Emergency Contact Name": "Cyril Sanket",
    "Emergency Contact Relationship": "Son",
    "Emergency Contact Tel #": "+968 9257 0909",
    "Place of Birth": "Muscat",
  };

  // enforce exact column order
  const ordered: Record<string, any> = {};
  EMPLOYEE_TEMPLATE_HEADERS.forEach((h) => {
    ordered[h] = exampleRow[h] ?? "";
  });

  const ws = XLSX.utils.json_to_sheet([ordered], {
    header: EMPLOYEE_TEMPLATE_HEADERS,
    skipHeader: false,
  });

  ws["!cols"] = EMPLOYEE_TEMPLATE_HEADERS.map((h) => ({
    wch: Math.min(Math.max(h.length + 2, 14), 45),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employees");
  XLSX.writeFile(wb, "employee_import_template.xlsx");
}

/* ---------------- Skeletons (Shimmer) ----------------
   ✅ Uses global .skeleton class (same as Asset page).
   Make sure you added this once in src/index.css:

   @keyframes shimmer{0%{transform:translateX(-60%)}100%{transform:translateX(60%)}}
   .skeleton{position:relative;overflow:hidden;border-radius:.75rem;background:rgba(148,163,184,.18)}
   .dark .skeleton{background:rgba(148,163,184,.10)}
   .skeleton::after{content:"";position:absolute;inset:0;transform:translateX(-60%);
     background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);
     animation:shimmer 1.2s ease-in-out infinite}
   .dark .skeleton::after{background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)}
------------------------------------------------------ */

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 p-4 shadow-sm">
      <div className="skeleton h-3 w-28" />
      <div className="mt-3 skeleton h-8 w-16" />
    </div>
  );
}

function EmployeesTableSkeleton({ rowsCount = 10 }: { rowsCount?: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="max-h-[70vh] overflow-y-auto">
        <table className="min-w-[1100px] w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Emp #</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Short Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Designation</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Department</th>
              {/* <th className="px-4 py-2 text-left font-medium text-slate-500">Employee Type</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Contract</th> */}
              <th className="px-4 py-2 text-left font-medium text-slate-500">Nationality</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Tel</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Email</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {Array.from({ length: rowsCount }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-20" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-40" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-36" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-40" />
                </td>
                {/* <td className="px-4 py-2">
                  <div className="skeleton h-4 w-36" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-36" />
                </td> */}
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-24" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-28" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-28" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-48" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmployeeImportPage() {
  const importMutation = useImportEmployees();
  const employeesQuery = useEmployeesList();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const result = importMutation.data as ImportResult | undefined;
  const hasErrors = (result?.errors?.length ?? 0) > 0;

  const employees: EmployeeRow[] = (employeesQuery.data ?? []) as any;

  // KPIs
  const totalEmployees = employees.length;

  const totalDepartments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      const v = norm(e.department);
      if (v) set.add(v);
    });
    return set.size;
  }, [employees]);

  const totalDesignations = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      const v = norm(e.designation);
      if (v) set.add(v);
    });
    return set.size;
  }, [employees]);

  // Filter table
  const rows = useMemo(() => {
    let out = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((e) => {
        return (
          (e.emp_number || "").toLowerCase().includes(q) ||
          (e.name || "").toLowerCase().includes(q) ||
          (e.short_name || "").toLowerCase().includes(q) ||
          (e.designation || "").toLowerCase().includes(q) ||
          (e.department || "").toLowerCase().includes(q) ||
          (e.employee_type || "").toLowerCase().includes(q) ||
          (e.contract_type || "").toLowerCase().includes(q) ||
          (e.nationality || "").toLowerCase().includes(q) ||
          (e.tel_number || "").toLowerCase().includes(q) ||
          (e.email_id || "").toLowerCase().includes(q)
        );
      });
    }
    return out;
  }, [employees, search]);

  const successText = useMemo(() => {
    if (!result) return "";
    const parts: string[] = [];
    if ((result.created ?? 0) > 0) parts.push(`${result.created} created`);
    if ((result.updated ?? 0) > 0) parts.push(`${result.updated} updated`);
    if (parts.length === 0) parts.push("No changes");
    return parts.join(" • ");
  }, [result]);

  const openModal = () => {
    setOpen(true);
    setDragOver(false);
  };

  const closeModal = () => {
    if (importMutation.isPending) return;
    setOpen(false);
    setDragOver(false);
  };

  const pickFile = () => fileInputRef.current?.click();

  const handleFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!isAllowed(f)) {
      alert("Only .csv, .tsv or .xlsx files are supported");
      return;
    }
    setFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    handleFile(dropped);
  };

  const onUpload = () => {
    if (!file) return;
    importMutation.mutate(file, {
      onSuccess: async (data: any) => {
        console.log("✅ Bulk upload response:", data);
        await employeesQuery.refetch();
        setOpen(false);
      },
    });
  };

  const showInitialLoading = employeesQuery.isLoading && !employeesQuery.data;

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-80" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Employee Import
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
              <button
                type="button"
                onClick={downloadEmployeeTemplateXlsx}
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-medium
                  text-slate-700 hover:bg-white
                  dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-slate-900
                  transition
                "
              >
                <Download className="h-4 w-4" />
                Download Template
              </button>

              <button
                type="button"
                onClick={openModal}
                className="
                  inline-flex items-center gap-2 rounded-full
                  bg-slate-900 px-3 py-2 text-xs font-medium text-white
                  hover:bg-slate-800
                  dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200
                  transition
                "
              >
                <UploadCloud className="h-4 w-4" />
                Import Employees
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between text-xs">
            <div className="w-full md:max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by emp#, name, dept, designation, type, email…"
                className="
                  w-full rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 pl-9 text-xs
                  text-slate-900 placeholder:text-slate-400
                  focus:outline-none focus:ring-1 focus:ring-slate-500
                  dark:bg-slate-950/60 dark:border-slate-700 dark:text-slate-100
                  dark:placeholder:text-slate-500
                  backdrop-blur
                "
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Clear search input"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>
                Showing{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">{rows.length}</span> /{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">{employees.length}</span>
              </span>
              {employeesQuery.isFetching && !showInitialLoading && <span>• Refreshing…</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPIs (with skeleton) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {showInitialLoading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <Kpi title="Total Employees" value={totalEmployees} />
            <Kpi title="Total Departments" value={totalDepartments} />
            <Kpi title="Total Designations" value={totalDesignations} />
          </>
        )}
      </div>

      {/* Import result KPIs */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi title="Imported Rows" value={(result.total_rows ?? 0) as number} />
          <Kpi title="Created" value={result.created ?? 0} tone="ok" />
          <Kpi title="Updated" value={result.updated ?? 0} />
          <Kpi
            title="Errors"
            value={result.errors?.length ?? 0}
            tone={(result.errors?.length ?? 0) > 0 ? "warn" : "neutral"}
          />
        </div>
      )}

      {/* Success banner (no errors) */}
      {importMutation.isSuccess && result && !hasErrors && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Import completed</span>
            <span className="opacity-80">• {successText}</span>
          </div>
        </div>
      )}

      {/* Warning banner (imported with errors) */}
      {result && hasErrors && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Imported with errors</span>
            <span className="opacity-80">
              • Created {result.created ?? 0} • Updated {result.updated ?? 0} • Failed{" "}
              {result.failed ?? result.errors?.length ?? 0}
            </span>
          </div>
        </div>
      )}

      {/* Hard error banner */}
      {importMutation.isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          Failed to import. Check file format / headers.
        </div>
      )}

      {/* Error table */}
      {hasErrors && result && (
        <div className="rounded-2xl border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950/60 overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Import errors (showing up to 200)
          </div>

          <div className="overflow-x-auto">
            <div className="max-h-[40vh] overflow-y-auto">
              <table className="min-w-[700px] w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Row</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Emp #</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {result.errors?.map((e, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.row}</td>
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">
                        {e.emp_number ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.error}</td>
                    </tr>
                  ))}

                  {(result.errors?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">
                        No errors.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Employees table (with shimmer skeleton) */}
      <div className="rounded-2xl border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950/60 overflow-hidden">
        {showInitialLoading ? (
          <EmployeesTableSkeleton rowsCount={10} />
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="min-w-[1100px] w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Emp #</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Short Name</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Designation</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Department</th>
                    {/* <th className="px-4 py-2 text-left font-medium text-slate-500">Employee Type</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Contract</th> */}
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Nationality</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Tel</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Email</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((e, idx) => (
                    <tr key={e.id ?? e.emp_number ?? idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">{e.emp_number}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.name}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.short_name ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.designation ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.department ?? "—"}</td>
                      {/* <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.employee_type ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.contract_type ?? "—"}</td> */}
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.nationality ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.tel_number ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.email_id ?? "—"}</td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                        {search
                          ? "No employees match your search."
                          : "No employees found. Click “Import Employees” to upload."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">
          Tip: swipe left/right to see all columns.
        </div>
      </div>

      {/* Import Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeModal} />

          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur shadow-2xl">
            {/* Header */}
            <div className="relative p-4 sm:p-5 border-b border-slate-200/70 dark:border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-70" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-white/70 grid place-items-center dark:border-slate-800 dark:bg-slate-900/60">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Import Employees</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Drag & drop a .csv/.tsv/.xlsx, or browse to upload.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={importMutation.isPending}
                  className="
                    inline-flex items-center justify-center rounded-full p-2
                    bg-white/70 text-slate-600 hover:bg-white hover:text-slate-800
                    dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900
                    transition
                  "
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.xlsx"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {/* Dropzone */}
              <div
                className={[
                  "rounded-2xl border-2 border-dashed p-6 transition",
                  dragOver
                    ? "border-slate-400 bg-slate-50 dark:bg-slate-800/40"
                    : "border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/40",
                ].join(" ")}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(false);
                }}
                onDrop={onDrop}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-700 grid place-items-center dark:bg-slate-900 dark:text-slate-100">
                    <FileUp className="h-6 w-6" />
                  </div>

                  <div className="text-sm font-medium text-slate-900 dark:text-slate-50">Drop your file here</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Supported: .csv, .tsv, .xlsx</div>

                  <button
                    type="button"
                    onClick={pickFile}
                    className="
                      mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium
                      bg-slate-900 text-white hover:bg-slate-800
                      dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200
                      transition
                    "
                  >
                    <UploadCloud className="h-4 w-4" />
                    Browse file
                  </button>
                </div>
              </div>

              {/* Selected file card */}
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Selected file</div>
                    <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                      {file ? file.name : "—"}
                    </div>
                    {file && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{humanBytes(file.size)}</div>
                    )}
                  </div>

                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      disabled={importMutation.isPending}
                      className="
                        inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium
                        border border-slate-200 bg-white/70 hover:bg-white
                        dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900
                        transition disabled:opacity-60
                      "
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={importMutation.isPending}
                className="
                  inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium
                  border border-slate-200 bg-white/70 hover:bg-white
                  dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900
                  transition disabled:opacity-60
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onUpload}
                disabled={!file || importMutation.isPending}
                className="
                  inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium
                  bg-slate-900 text-white hover:bg-slate-800
                  dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200
                  transition disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Kpi({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: number;
  tone?: "neutral" | "ok" | "warn";
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-50/70 text-emerald-900 border-emerald-200/70 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800/60"
      : tone === "warn"
      ? "bg-amber-50/70 text-amber-900 border-amber-200/70 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-800/60"
      : "bg-white/70 text-slate-900 border-slate-200/70 dark:bg-slate-950/60 dark:text-slate-50 dark:border-slate-800";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${cls}`}>
      <div className="text-[11px] opacity-70">{title}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
