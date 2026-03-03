"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";

const CHANNELS = ["Amazon", "Email", "Marketing", "Social Media", "Website", "Blog", "Amazon Video", "Other", "AI", "Event", "test", "Bing"];

const MAX_FILES = 10;
const MAX_TOTAL_MB = 100;
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    taskName: "",
    brief: "",
    channel: [] as string[],
    dueDate: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>("");

  const toggleArrayItem = (field: "channel", item: string) => {
    setFormData((prev) => {
      const current = prev[field];
      return current.includes(item)
        ? { ...prev, [field]: current.filter((c) => c !== item) }
        : { ...prev, [field]: [...current, item] };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const newFiles = Array.from(e.target.files || []);
    const combined = [...selectedFiles, ...newFiles];
    if (combined.length > MAX_FILES) { setFileError(`Maximum ${MAX_FILES} files allowed.`); return; }
    if (combined.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_BYTES) { setFileError(`Total cannot exceed ${MAX_TOTAL_MB}MB.`); return; }
    setSelectedFiles(combined);
    e.target.value = "";
  };

  const removeFile = (index: number) => { setSelectedFiles((prev) => prev.filter((_, i) => i !== index)); setFileError(""); };
  const formatBytes = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setIsSubmitting(true);
    try {
      const fileLinks: string[] = [];
      for (const file of selectedFiles) {
  const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
    method: "POST",
    body: file,
  });
  if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name}`);
  const blobData = await uploadRes.json();
  fileLinks.push(blobData.url);
}
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          taskName: formData.taskName,
          brief: formData.brief,
          channel: formData.channel,
          dueDate: formData.dueDate,
          fileLinks: fileLinks.length > 0 ? fileLinks : undefined,
        }),
      });
      if (res.ok) {
        router.push("/tasks");
      } else {
        const err = await res.json();
        alert("Failed to create task: " + (err.error || "Unknown"));
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full overflow-y-auto pb-20">
      <Link href="/" className="inline-flex items-center text-brand-text/50 hover:text-brand-accent transition-colors mb-8">
        <ArrowLeft size={20} className="mr-2" />
        <span className="font-bebas tracking-wide text-lg mt-1">Back to Dashboard</span>
      </Link>
      <div className="bg-brand-card border border-brand-border p-8 rounded-sm shadow-xl">
        <h1 className="text-4xl text-brand-accent mb-2">New Action Engine Request</h1>
        <p className="text-brand-text/50 font-bebas text-xl mb-8">Fill out the details below to submit a new marketing request to the pipeline.</p>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block font-bebas text-xl text-brand-text/80 mb-2">Task Name <span className="text-brand-danger">*</span></label>
            <input type="text" required className="input-field" placeholder="e.g., Summer Social Media Campaign" value={formData.taskName} onChange={(e) => setFormData({ ...formData, taskName: e.target.value })} />
          </div>
          <div>
            <label className="block font-bebas text-xl text-brand-text/80 mb-2">Brief</label>
            <textarea className="input-field min-h-[120px]" placeholder="Describe the requirements..." value={formData.brief} onChange={(e) => setFormData({ ...formData, brief: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block font-bebas text-xl text-brand-text/80 mb-2">Channel</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => (
                  <button key={c} type="button" onClick={() => toggleArrayItem("channel", c)}
                    className={`px-3 py-1 text-sm border rounded-sm transition-colors ${formData.channel.includes(c) ? "bg-brand-accent border-brand-accent text-brand-bg font-bold" : "border-brand-border text-brand-text/70 hover:border-brand-text/30"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-bebas text-xl text-brand-text/80 mb-2">Due Date</label>
              <input type="date" className="input-field cursor-pointer" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block font-bebas text-xl text-brand-text/80 mb-2">
              File / Media Upload
              <span className="ml-2 text-sm font-sans text-brand-text/40 normal-case">(max {MAX_FILES} files, {MAX_TOTAL_MB}MB total)</span>
            </label>
            <input type="file" multiple className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-bold file:bg-brand-accent file:text-brand-bg hover:file:brightness-110 cursor-pointer text-brand-text/70"
              onChange={handleFileChange} disabled={selectedFiles.length >= MAX_FILES} />
            {fileError && <p className="mt-2 text-sm text-brand-danger">{fileError}</p>}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-brand-bg border border-brand-border rounded-sm px-3 py-2">
                    <span className="text-sm text-brand-text/70 truncate max-w-[80%]">{file.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-brand-text/40">{formatBytes(file.size)}</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-brand-text/40 hover:text-brand-danger transition-colors"><X size={14} /></button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-brand-text/40 text-right">{selectedFiles.length}/{MAX_FILES} files · {formatBytes(totalSize)} / {MAX_TOTAL_MB}MB</p>
              </div>
            )}
          </div>
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={isSubmitting} className={`btn-primary flex items-center ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
              {isSubmitting ? <div className="h-5 w-5 mr-3 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div> : <Save size={20} className="mr-3" />}
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
