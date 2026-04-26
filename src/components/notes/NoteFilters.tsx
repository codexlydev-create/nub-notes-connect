import { useMemo } from "react";
import { Search, RotateCcw } from "lucide-react";
import { DEPARTMENTS, COURSES_BY_DEPT } from "@/data/seed";
import type { NoteType } from "@/lib/types";

export interface FilterState {
  department: string;
  course: string;
  title: string;
  type: string;
  courseCode: string;
  studentId: string;
}

export const emptyFilters: FilterState = {
  department: "", course: "", title: "", type: "", courseCode: "", studentId: "",
};

export default function NoteFilters({ value, onChange }: { value: FilterState; onChange: (v: FilterState) => void }) {
  const allDepartments = useMemo(() => [...DEPARTMENTS].sort(), []);
  const courses = value.department ? COURSES_BY_DEPT[value.department] ?? [] : [];
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="rounded-2xl bg-card border border-border shadow-card p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Select label="Department" value={value.department} onChange={(v) => onChange({ ...value, department: v, course: "" })} options={["", ...allDepartments]} />
        <Select label="Course" value={value.course} onChange={(v) => set("course", v)} options={["", ...courses]} disabled={!value.department} />
        <Field label="Course Title">
          <input
            value={value.title}
            onChange={(e) => set("title", e.target.value)}
            className="input-style"
            placeholder="e.g. Binary Trees"
          />
        </Field>
        <Select label="Type" value={value.type} onChange={(v) => set("type", v as NoteType | "")} options={["", "Slide", "Hand Notes"]} />
        <Field label="Course Code">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <input
              value={value.courseCode}
              onChange={(e) => set("courseCode", e.target.value)}
              className="input-style"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="CSE 2101"
            />
          </div>
        </Field>
        <Field label="Student ID">
          <input
            value={value.studentId}
            onChange={(e) => set("studentId", e.target.value)}
            className="input-style"
            placeholder="e.g. 0102210"
          />
        </Field>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={() => onChange(emptyFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-muted hover:bg-accent transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset Filters
        </button>
      </div>
      <style>{`.input-style { width:100%; padding:0.6rem 0.9rem; border-radius: 0.75rem; border:1px solid hsl(var(--border)); background: hsl(var(--background)); font-size: 0.875rem; outline: none; transition: border-color .15s, box-shadow .15s; }
        .input-style:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
function Select({ label, value, onChange, options, disabled }: any) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input-style disabled:opacity-50"
      >
        {options.map((o: string) => (
          <option key={o || "any"} value={o}>{o || `Any ${label.toLowerCase()}`}</option>
        ))}
      </select>
    </Field>
  );
}