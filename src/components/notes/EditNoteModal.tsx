import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, UploadCloud, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { notesApi } from "@/lib/notesApi";
import { taxonomyApi } from "@/lib/taxonomyApi";
import { uploadsApi, putToPresignedUrl } from "@/lib/uploadsApi";
import { ApiError } from "@/lib/api";
import { DEPARTMENTS, COURSES_BY_DEPT } from "@/data/seed";
import type { Note, NoteType } from "@/lib/types";

const MAX_BYTES = 50 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function EditNoteModal({
  note,
  onClose,
  onSaved,
}: {
  note: Note;
  onClose: () => void;
  onSaved: (n: Note) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(note.title);
  const [description, setDescription] = useState(note.description ?? "");
  const [department, setDepartment] = useState(note.department);
  const [course, setCourse] = useState(note.course);
  const [courseCode, setCourseCode] = useState(note.courseCode);
  const [type, setType] = useState<NoteType>(note.type);
  const [file, setFile] = useState<File | null>(null);

  const [departments, setDepartments] = useState<string[]>([...DEPARTMENTS].sort());
  const [coursesByDept, setCoursesByDept] = useState<Record<string, string[]>>(COURSES_BY_DEPT);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");
  const isBusy = status !== "idle";

  useEffect(() => {
    taxonomyApi.list()
      .then((t) => { setDepartments(t.departments); setCoursesByDept(t.coursesByDept); })
      .catch(() => {});
  }, []);

  const allDepartments = useMemo(
    () => Array.from(new Set([...departments, department].filter(Boolean))).sort(),
    [departments, department]
  );
  const courseOptions = useMemo(
    () => Array.from(new Set([...(coursesByDept[department] ?? []), course].filter(Boolean))),
    [coursesByDept, department, course]
  );

  function pickFile(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf") return toast.error("Only PDF files are allowed");
    if (f.size > MAX_BYTES) return toast.error("File is larger than 50 MB");
    setFile(f);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!department || !course || !courseCode) {
      return toast.error("Please fill in all required fields");
    }

    try {
      let nextNote: Note | null = null;

      if (file) {
        // Replace the file: presign → PUT → save-file (creates a new doc),
        // then delete the old one to keep dashboard clean.
        setStatus("uploading");
        setProgress(0);
        const { uploadUrl, fileUrl, key } = await uploadsApi.presign({
          fileName: file.name,
          fileType: "application/pdf",
          fileSize: file.size,
        });
        await putToPresignedUrl(uploadUrl, file, setProgress);

        setStatus("saving");
        const saved = await uploadsApi.saveFile({
          title: title.trim(),
          description: description.trim(),
          department,
          course,
          courseCode: courseCode.trim(),
          type,
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          fileKey: key,
        });
        nextNote = saved.note;

        // Best-effort cleanup of the previous note record.
        try { await notesApi.remove(note.id); } catch { /* ignore */ }
      } else {
        setStatus("saving");
        const r = await notesApi.update(note.id, {
          title: title.trim(),
          description: description.trim(),
          department,
          course,
          courseCode: courseCode.trim(),
          type,
        });
        nextNote = r.note;
      }

      toast.success("Note updated");
      onSaved(nextNote!);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || "Could not update note";
      toast.error(msg);
      setStatus("idle");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={isBusy ? undefined : onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-elegant p-6 md:p-7"
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-xl font-bold">Edit note</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Update details or replace the PDF.</p>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Title*">
            <input
              className="input-style"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isBusy}
              maxLength={200}
            />
          </Field>

          <Field label="Description">
            <textarea
              className="input-style min-h-[140px] resize-y leading-relaxed"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isBusy}
              maxLength={2000}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Department*">
              <select
                className="input-style"
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setCourse(""); }}
                disabled={isBusy}
              >
                <option value="">Select department</option>
                {allDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="Course*">
              <input
                className="input-style"
                list="edit-course-options"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                disabled={isBusy || !department}
                maxLength={150}
                placeholder={department ? "Select or type a course" : "Select department first"}
              />
              <datalist id="edit-course-options">
                {courseOptions.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>

            <Field label="Course Code*">
              <input
                className="input-style"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                disabled={isBusy}
                maxLength={40}
              />
            </Field>

            <Field label="Type*">
              <select
                className="input-style"
                value={type}
                onChange={(e) => setType(e.target.value as NoteType)}
                disabled={isBusy}
              >
                <option value="Slide">Slide</option>
                <option value="Hand Notes">Hand Notes</option>
              </select>
            </Field>
          </div>

          <Field label="Replace PDF (optional)">
            <label
              htmlFor="edit-pdf-input"
              className="block cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/60 transition-colors p-4 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0] ?? null); }}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <div className="font-semibold text-sm truncate max-w-[16rem]">{file.name}</div>
                    <div className="text-[11px] text-muted-foreground">{formatSize(file.size)} · will replace existing file</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                    className="ml-2 p-1 rounded-full hover:bg-background"
                    aria-label="Remove file"
                    disabled={isBusy}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <UploadCloud className="w-7 h-7 text-muted-foreground" />
                  <div className="text-sm font-medium">Click or drop a new PDF</div>
                  <div className="text-[11px] text-muted-foreground">
                    Current: {note.fileName || "—"}{note.fileSize ? ` · ${formatSize(note.fileSize)}` : ""}
                  </div>
                </div>
              )}
              <input
                id="edit-pdf-input"
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                disabled={isBusy}
              />
            </label>
          </Field>

          {status === "uploading" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading new file…</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isBusy}>Cancel</Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status === "uploading" ? `Uploading ${progress}%` : "Saving…"}
                </span>
              ) : (
                <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save changes</span>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}