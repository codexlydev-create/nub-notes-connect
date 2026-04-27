import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UploadCloud, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { DEPARTMENTS, COURSES_BY_DEPT } from "@/data/seed";
import { taxonomyApi } from "@/lib/taxonomyApi";
import { uploadsApi, putToPresignedUrl } from "@/lib/uploadsApi";
import { ApiError } from "@/lib/api";
import type { NoteType } from "@/lib/types";

const MAX_BYTES = 50 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Upload() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deptChoice, setDeptChoice] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [courseChoice, setCourseChoice] = useState("");
  const [customCourse, setCustomCourse] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [type, setType] = useState<NoteType>("Slide");

  // Live taxonomy from backend (includes user-added items).
  const [departments, setDepartments] = useState<string[]>([...DEPARTMENTS].sort());
  const [coursesByDept, setCoursesByDept] = useState<Record<string, string[]>>(COURSES_BY_DEPT);

  useEffect(() => {
    taxonomyApi.list()
      .then((t) => { setDepartments(t.departments); setCoursesByDept(t.coursesByDept); })
      .catch(() => {});
  }, []);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "presigning" | "uploading" | "saving" | "done">("idle");
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  const allDepartments = useMemo(() => [...departments].sort(), [departments]);
  const isOtherDept = deptChoice === "__other__";
  const department = isOtherDept ? customDept.trim() : deptChoice;
  const courses = !isOtherDept && department ? coursesByDept[department] ?? [] : [];
  const isOtherCourse = isOtherDept || courseChoice === "__other__";
  const course = isOtherCourse ? customCourse.trim() : courseChoice;
  const isBusy = status === "presigning" || status === "uploading" || status === "saving";

  if (authLoading) {
    return <div className="max-w-md mx-auto mt-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Sign in to upload</h1>
        <p className="text-muted-foreground mb-6">You need an account to share notes.</p>
        <Button onClick={() => navigate("/login")}>Go to login</Button>
      </div>
    );
  }

  function pickFile(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("File is larger than 50 MB");
      return;
    }
    setFile(f);
    setTitle(f.name.replace(/\.pdf$/i, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Please select a PDF");
    if (!department || !course || !courseCode) {
      return toast.error("Please fill in all required fields");
    }
    if (deptChoice === "__other__" && !customDept.trim()) {
      return toast.error("Please enter the department name");
    }
    if ((deptChoice === "__other__" || courseChoice === "__other__") && !customCourse.trim()) {
      return toast.error("Please enter the course name");
    }

    try {
      setStatus("presigning");
      setProgress(0);
      const { uploadUrl, fileUrl, key } = await uploadsApi.presign({
        fileName: file.name,
        fileType: "application/pdf",
        fileSize: file.size,
      });

      setStatus("uploading");
      await putToPresignedUrl(uploadUrl, file, setProgress);

      setStatus("saving");

      // Persist newly entered department / course to taxonomy so future
      // uploads + Find filters list them automatically.
      try {
        if (deptChoice === "__other__" && customDept.trim()) {
          await taxonomyApi.add({ kind: "department", name: customDept.trim() });
        }
        if (courseChoice === "__other__" && customCourse.trim() && department) {
          await taxonomyApi.add({ kind: "course", name: customCourse.trim(), parent: department });
        }
      } catch { /* non-fatal */ }

      const { note } = await uploadsApi.saveFile({
        title: (title || file.name.replace(/\.pdf$/i, "")).trim(),
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

      setStatus("done");
      setSavedUrl(note.fileUrl || fileUrl);
      toast.success("Upload complete!");
    } catch (err: any) {
      setStatus("idle");
      const msg = err instanceof ApiError ? err.message : err?.message || "Upload failed";
      toast.error(msg);
    }
  }

  function reset() {
    setFile(null);
    setTitle("");
    setDescription("");
    setDeptChoice("");
    setCustomDept("");
    setCourseChoice("");
    setCustomCourse("");
    setCourseCode("");
    setType("Slide");
    setProgress(0);
    setStatus("idle");
    setSavedUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Upload a Note</h1>
        <p className="text-muted-foreground mt-1">PDF only · up to 50&nbsp;MB · uploaded directly to Cloudflare R2.</p>
      </motion.div>

      {status === "done" && savedUrl ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
          <h2 className="text-xl font-semibold mt-4">Note uploaded successfully</h2>
          <p className="text-sm text-muted-foreground mt-1 break-all">{savedUrl}</p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button onClick={() => window.open(savedUrl, "_blank")} variant="outline">
              View file
            </Button>
            <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
            <Button variant="ghost" onClick={reset}>Upload another</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Dropzone */}
          <label
            htmlFor="pdf-input"
            className="block cursor-pointer rounded-2xl border-2 border-dashed border-border bg-card hover:border-primary/60 transition-colors p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <div className="font-semibold truncate max-w-xs">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{formatSize(file.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                  className="ml-2 p-1 rounded-full hover:bg-muted"
                  aria-label="Remove file"
                  disabled={isBusy}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="w-10 h-10 text-muted-foreground" />
                <div className="font-semibold">Click or drag a PDF here</div>
                <div className="text-xs text-muted-foreground">Max 50 MB · application/pdf</div>
              </div>
            )}
            <input
              id="pdf-input"
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              disabled={isBusy}
            />
          </label>

          {/* Progress */}
          {(status === "uploading" || status === "presigning" || status === "saving") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {status === "presigning" && "Preparing upload…"}
                  {status === "uploading" && `Uploading to Cloudflare R2…`}
                  {status === "saving" && "Saving note…"}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={status === "uploading" ? progress : status === "saving" ? 100 : 5} />
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Department*">
              <select
                className="input-style"
                value={deptChoice}
                onChange={(e) => {
                  setDeptChoice(e.target.value);
                  setCourseChoice("");
                  setCustomCourse("");
                  if (e.target.value !== "__other__") setCustomDept("");
                }}
                disabled={isBusy}
              >
                <option value="">Select department</option>
                {allDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
                <option value="__other__">Others (enter manually)</option>
              </select>
              {deptChoice === "__other__" && (
                <input
                  className="input-style mt-2"
                  placeholder="Enter department name"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  disabled={isBusy}
                  maxLength={120}
                />
              )}
            </Field>
            <Field label="Course*">
              <select
                className="input-style"
                value={courseChoice}
                onChange={(e) => {
                  setCourseChoice(e.target.value);
                  if (e.target.value !== "__other__") setCustomCourse("");
                }}
                disabled={isBusy || (!isOtherDept && !department)}
              >
                <option value="">{department || isOtherDept ? "Select course" : "Select department first"}</option>
                {courses.map((c) => <option key={c} value={c}>{c}</option>)}
                {(isOtherDept || department) && <option value="__other__">Others (enter manually)</option>}
              </select>
              {(isOtherDept || courseChoice === "__other__") && (
                <input
                  className="input-style mt-2"
                  placeholder="Enter course name"
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  disabled={isBusy}
                  maxLength={150}
                />
              )}
            </Field>
            <Field label="Course Code*">
              <input className="input-style" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} disabled={isBusy} maxLength={40} />
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
            <Field label="Description">
              <textarea
                className="input-style min-h-[42px]"
                rows={1}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isBusy}
                maxLength={2000}
                placeholder="Optional"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={reset} disabled={isBusy}>Reset</Button>
            <Button type="submit" disabled={isBusy || !file}>
              {isBusy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status === "presigning" && "Preparing…"}
                  {status === "uploading" && `Uploading ${progress}%`}
                  {status === "saving" && "Saving…"}
                </span>
              ) : (
                <span className="flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Upload note</span>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
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