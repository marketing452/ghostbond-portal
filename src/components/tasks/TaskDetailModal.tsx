"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/types/task";
import { X, ExternalLink, Calendar, Send } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { format } from "date-fns";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

export default function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [assignedEmail, setAssignedEmail] = useState(task.assignedTo[0] || "");
  
  // Comments State
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetch(`/api/comments?email=${encodeURIComponent(user.email)}&taskId=${task.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.comments) setComments(data.comments);
        })
        .finally(() => setLoadingComments(false));
    }
  }, [task.id, user?.email]);

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
        onUpdate({
          ...task,
          status,
          dueDate: dueDate || null,
          assignedTo: assignedEmail ? [assignedEmail] : [],
        });
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

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.email) return;

    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          taskId: task.id,
          text: newComment,
        }),
      });

      if (res.ok) {
        setNewComment("");
        // Optimistically add
        setComments([{ id: Date.now().toString(), text: `[${user.email}] ${newComment}`, createdTime: new Date().toISOString() }, ...comments]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-brand-bg border border-brand-border rounded-lg shadow-2xl z-10 w-full max-w-5xl max-h-full flex flex-col md:flex-row overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-text/50 hover:text-brand-text z-20">
          <X size={24} />
        </button>

        {/* Info Panel */}
        <div className="flex-1 p-8 overflow-y-auto border-r border-brand-border custom-scrollbar">
          <div className="mb-6">
            <h2 className="text-4xl text-brand-accent mb-2 pr-8">{task.name}</h2>
            <div className="flex items-center gap-2 text-brand-text/60">
              <span className="uppercase tracking-wide text-xs border border-brand-border px-2 py-0.5 bg-brand-card">{task.status}</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Deliverable button removed to prevent duplication, moved to Properties list below */}

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
                    <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Effort</span>
                    <span className="text-brand-text/90">{task.effort || "None"}</span>
                  </div>
                  <div>
                    <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Deliverable URL</span>
                    {task.deliverable ? (
                      <a href={task.deliverable} target="_blank" className="text-brand-accent hover:underline break-all">{task.deliverable}</a>
                    ) : <span className="text-brand-text/90">None</span>}
                  </div>
                  <div>
                    <span className="text-brand-text/40 block text-xs uppercase tracking-wider">Files & Media</span>
                    {task.fileLink ? (
                      <a href={task.fileLink} target="_blank" className="text-brand-accent hover:underline break-all">View Attached File</a>
                    ) : <span className="text-brand-text/90">None</span>}
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

              {/* Manager Edit Section */}
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
                <div key={c.id} className="bg-brand-bg border border-brand-border/50 p-3 rounded-sm">
                  <p className="text-xs text-brand-text/40 mb-1">{format(new Date(c.createdTime), "MMM d • h:mm a")}</p>
                  <p className="text-sm text-brand-text/90 leading-snug break-words">{c.text}</p>
                </div>
              ))
            ) : (
              <p className="text-brand-text/40 text-sm italic">No comments yet.</p>
            )}
          </div>

          <form onSubmit={handlePostComment} className="p-4 bg-brand-card border-t border-brand-border flex gap-2">
            <input 
              type="text" 
              placeholder="Add a comment..."
              className="input-field py-2 flex-1 bg-brand-bg text-sm placeholder:text-brand-text/30"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button type="submit" className="bg-brand-accent text-brand-bg p-2 rounded-sm hover:brightness-110" disabled={!newComment.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
