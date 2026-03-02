"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";

const CHANNELS = ["Amazon", "Email", "Marketing", "Social Media", "Website", "Blog", "Amazon Video", "Other", "AI", "Event", "test", "Bing"];

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const toggleArrayItem = (field: "channel", item: string) => {
    setFormData((prev) => {
      const current = prev[field];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter((c) => c !== item) };
      } else {
        return { ...prev, [field]: [...current, item] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setIsSubmitting(true);
    try {
      let finalFileLink = "";

      // Handle file upload sequence natively using Vercel Blob
      if (selectedFile) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(selectedFile.name)}`, {
          method: 'POST',
          body: selectedFile,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload file to Blob storage.");
        const blobData = await uploadRes.json();
        finalFileLink = blobData.url;
      }

      // Automatically binds session user.email inside route
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          taskName: formData.taskName,
          brief: formData.brief,
          channel: formData.channel,
          dueDate: formData.dueDate,
          fileLink: finalFileLink || undefined,
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
          {/* Requested By is omitted, implicitly tied to logged in User */}

          <div>
            <label className="block font-bebas text-xl text-brand-text/80 mb-2">Task Name <span className="text-brand-danger">*</span></label>
            <input 
              type="text" 
              required
              className="input-field" 
              placeholder="e.g., Summer Social Media Campaign"
              value={formData.taskName}
              onChange={(e) => setFormData({...formData, taskName: e.target.value})}
            />
          </div>

          <div>
            <label className="block font-bebas text-xl text-brand-text/80 mb-2">Brief</label>
            <textarea 
              className="input-field min-h-[120px]" 
              placeholder="Describe the requirements..."
              value={formData.brief}
              onChange={(e) => setFormData({...formData, brief: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block font-bebas text-xl text-brand-text/80 mb-2">Channel</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleArrayItem("channel", c)}
                    className={`px-3 py-1 text-sm border rounded-sm transition-colors ${
                      formData.channel.includes(c) 
                        ? 'bg-brand-accent border-brand-accent text-brand-bg font-bold' 
                        : 'border-brand-border text-brand-text/70 hover:border-brand-text/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bebas text-xl text-brand-text/80 mb-2">Due Date</label>
              <input 
                type="date" 
                className="input-field cursor-pointer" 
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block font-bebas text-xl text-brand-text/80 mb-2">File / Media Upload</label>
            <input 
              type="file"
              className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-bold file:bg-brand-accent file:text-brand-bg hover:file:brightness-110 cursor-pointer text-brand-text/70"
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`btn-primary flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 mr-3 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={20} className="mr-3" />
              )}
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
