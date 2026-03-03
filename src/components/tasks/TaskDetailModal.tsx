"use client";

import { upload } from '@vercel/blob/client';
import { useState, useEffect, useRef } from "react";
import type { Task } from "@/types/task";
import { X, Send, Paperclip, FileIcon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { format } from "date-fns";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

const MAX_COMMENT_FILES = 10;
const MAX_COMMENT_BYTES = 100 * 1024 * 1024;

export default function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [assignedEmail, setAssignedEmail] = useState(task.assignedTo[0] || "");
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetch(`/api/comments?email=${encodeURIComponent(user.email)}&taskId=${task.id}`)
        .then(res => res.json())
        .then(data => { if (data.comments) setComments(data.comments); })
        .finally(() => setLoadingComments(false));
    }
  }, [task.id, user?.email]);

  useEffect(() => {
    if ("Notification" in window) {
      setNotifSupported(true);
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifEnabled(true);
      localStorage.setItem(`notif_${task.id}_${user?.email}`, "true");
      new Notification("Notifications enabled", {
        body: `You'll be notified when "${task.name}" is updated.`,
        icon: "/favicon.ico",
      });
    }
  };

  const handleSave = async () => {
    if (!user?.email) return;
    setIsEditing(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          status,
          dueDate: dueDate || null,
          assignedToEmails: assignedEmail ? [assignedEmail] : [],
        }),
      });
      if (res.ok) {
        if (Notification.permission === "granted" && localStorage.getItem(`notif_${task.id}_${user.email}`)) {
          new Notification(`Task updated: ${task.name}`, {
            body: `Status changed to "${status}"`,
            icon: "/favicon.ico",
          });
        }
        onUpdate({ ...task, status, dueDate: dueDate || null, assignedTo: assignedEmail ? [assignedEmail] : [] });
        onClose();
      } else {
        alert("Failed to update task");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating task");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const incoming = Array.from(e.target.files || []);
    const combined = [...commentFiles, ...incoming];
    if (combined.length > MAX_COMMENT_FILES) { setFileError(`Max ${MAX_COMMENT_FILES} files.`); return; }
    if (combined.reduce((s, f) => s + f.size, 0) > MAX_COMMENT_BYTES) { setFileError("Total size exceeds 100MB."); return; }
    setCommentFiles(combined);
    e.target.value = "";
  };

  const removeCommentFile = (i: number) => {
    setCommentFiles(prev => prev.filter((_, idx) => idx !== i));
    setFileError("");
  };

  const formatBytes = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && commentFiles.length === 0) || !user?.email) return;
    setIsPosting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of commentFiles) {
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          clientPayload: user.email,
        });
        uploadedUrls.push(blob.url);
      }

      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, taskId: task.id, text: newComment, fileUrls: uploadedUrls }),
      });

      if (res.ok) {
        // Derive display name from email for immediate UI update
        const displayName = user.email.split('@')[0].split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setComments(prev => [{
          id: Date.now().toString(),
          text: newComment,
          fileUrls: uploadedUrls,
          createdTime: new Date().toISOString(),
          createdBy: displayName,
        }, ...prev]);
        setNewComment("");
        setCommentFiles([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to post comment.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-brand-bg border border-brand-border rounded-lg shadow-2xl z-10 w-full max-w-5xl max-h-full flex flex-col md:flex-row overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-text/50 hover:text-brand-text z-20"><X size={24} /></button>

        {/* Info Panel */}
        <div className="flex-1 p-8 overflow-y-auto border-r border-brand-border custom-scrollbar">
          <div className="mb-6">
            <h2 className="text-4xl text-brand-accent mb-2 pr-8">{task.name}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="uppercase tracking-wide text-xs border border-brand-border px-2 py-0.5 bg-brand-card text-brand-text/60">{task.status}</span>
              {notifSupported && (
                <button onClick={handleEnableNotifications}
                  className={`text-xs px-2 py-0.5 border rounded-sm transition-colors ${notifEnabled ? "border-brand-accent text-brand-accent bg-brand-accent/10" : "border-brand-border text-brand-text/40 hover:border-brand-text/30"}`}>
                  {notifEnabled ? "🔔 Notifications On" : "🔕 Enable Notifications"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-bebas text-xl text-brand-text/50 border-b border-brand-border pb-1 mb-3">Brief</h3>
              <p className="whitespace-pre-wrap text-brand-text/80 leading-relaxed text-sm">{task.brief || "No brief provided."}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bebas text-xl text-brand-text/50 border-b border-brand-border pb-1 mb-3">Properties</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Channel</span>
                    <span className="text-brand-text/90">{task.channel?.join(", ") || "None"}</span>
                  </div>
                  <div>
                    <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Creative Type</span>
                    <span className="text-brand-text/90">{task.creativeType?.join(", ") || "None"}</span>
                  </div>
                  <div>
                    <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Requested By</span>
                    <span className="text-brand-text/90">{task.requestedBy?.join(", ") || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Deliverable URL</span>
                    {task.deliverable
                      ? <a href={task.deliverable} target="_blank" className="text-brand-accent hover:underline break-all">{task.deliverable}</a>
                      : <span className="text-brand-text/90">None</span>}
                  </div>
                  <div>
                    <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Files & Media</span>
                    {task.fileLink
                      ? <a href={task.fileLink} target="_blank" className="text-brand-accent hover:underline break-all">View Attached File</a>
                      : <span className="text-brand-text/90">None</span>}
                  </div>
                  {!user?.isManager && (
                    <>
                      <div>
                        <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Assigned To</span>
                        <span className="text-brand-text/90">{task.assignedTo?.join(", ") || "Unassigned"}</span>
                      </div>
                      <div>
                        <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Due Date</span>
                        <span className="text-brand-text/90">{task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "None"}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {user?.isManager && (
                <div className="bg-brand-card/50 p-4 border border-brand-border/50 rounded-sm">
                  <h3 className="font-bebas text-xl text-brand-accent mb-3 flex items-center justify-between">
                    Management
                    <button onClick={handleSave} disabled={isEditing} className="text-xs bg-brand-accent text-brand-bg px-3 py-1 rounded-sm hover:brightness-110">
                      {isEditing ? "Saving..." : "Save Changes"}
                    </button>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-brand-text/40 block text-xs uppercase tracking-wider mb-1">Status</label>
                      <select className="input-field py-1 text-sm bg-brand-bg" value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="Requests">Requests</option>
                        <option value="Backlogs">Backlogs</option>
                        <option value="In progress">In progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-brand-text/40 block text-xs uppercase tracking-wider mb-1">Due Date</label>
                      <input type="date" className="input-field py-1 text-sm bg-brand-bg" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-brand-text/40 block text-xs uppercase tracking-wider mb-1">Assigned Email</label>
                      <input type="email" placeholder="user@ghostbond.com" className="input-field py-1 text-sm bg-brand-bg" value={assignedEmail} onChange={e => setAssignedEmail(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Panel */}
        <div className="w-full md:w-1/3 bg-brand-card flex flex-col h-64 md:h-auto border-t md:border-t-0 border-brand-border">
          <div className="p-4 border-b border-brand-border">
            <h3 className="font-bebas text-xl text-brand-text/80">Activity & Comments</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-brand-bg/20">
            {loadingComments ? (
              <p className="text-brand-text/40 text-sm italic">Loading comments...</p>
            ) : comments.length > 0 ? (
              comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  {/* Avatar */}
                  <div className="shrink-0 w-7 h-7 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-xs font-bold text-brand-accent uppercase">
                    {c.createdBy?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-brand-text/80">{c.createdBy}</span>
                      <span className="text-xs text-brand-text/30">{format(new Date(c.createdTime), "MMM d • h:mm a")}</span>
                    </div>
                    <div className="bg-brand-bg border border-brand-border/50 rounded-sm px-3 py-2">
                      {c.text && <p className="text-sm text-brand-text/90 leading-snug break-words">{c.text}</p>}
                      {c.fileUrls && c.fileUrls.length > 0 && (
                        <div className={`space-y-1 ${c.text ? 'mt-2 pt-2 border-t border-brand-border/30' : ''}`}>
                          {c.fileUrls.map((url: string, i: number) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-brand-accent hover:underline">
                              <FileIcon size={12} />
                              {decodeURIComponent(url.split('/').pop() || `File ${i + 1}`)}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-brand-text/40 text-sm italic">No comments yet.</p>
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handlePostComment} className="p-4 bg-brand-card border-t border-brand-border space-y-2">
            {commentFiles.length > 0 && (
              <div className="space-y-1">
                {commentFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-brand-bg border border-brand-border/50 rounded-sm px-2 py-1">
                    <span className="text-xs text-brand-text/60 truncate max-w-[75%]">{f.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-brand-text/30">{formatBytes(f.size)}</span>
                      <button type="button" onClick={() => removeCommentFile(i)} className="text-brand-text/30 hover:text-brand-danger"><X size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {fileError && <p className="text-xs text-brand-danger">{fileError}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                className="input-field py-2 flex-1 bg-brand-bg text-sm placeholder:text-brand-text/30"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleCommentFileChange} disabled={commentFiles.length >= MAX_COMMENT_FILES} />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="bg-brand-card border border-brand-border text-brand-text/50 hover:text-brand-accent p-2 rounded-sm transition-colors" title="Attach files">
                <Paperclip size={18} />
              </button>
              <button type="submit"
                className="bg-brand-accent text-brand-bg p-2 rounded-sm hover:brightness-110 disabled:opacity-40"
                disabled={isPosting || (!newComment.trim() && commentFiles.length === 0)}>
                {isPosting
                  ? <div className="h-[18px] w-[18px] border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                  : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
