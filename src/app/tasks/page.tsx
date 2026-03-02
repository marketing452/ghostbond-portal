"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/types/task";
import { useAuth } from "@/components/auth/AuthContext";
import { useTasksPolling } from "@/hooks/useTasksPolling";
import TaskCard from "@/components/tasks/TaskCard";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { CopyPlus } from "lucide-react";

const COLUMNS = [
  { id: "Requests", title: "Submitted", color: "bg-brand-border/50" },
  { id: "Backlogs", title: "In Backlog", color: "bg-brand-accent/20" },
  { id: "In progress", title: "In Progress", color: "bg-brand-info/20" },
  { id: "Done", title: "Done", color: "bg-brand-success/20" },
];

export default function TasksPage() {
  const { user } = useAuth();
  const { tasks, isLoading, mutateTasks } = useTasksPolling();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleUpdate = (updatedTask: Task) => {
    // Optimistically update the local data using mutateTasks
    mutateTasks(
      (currentData: { tasks: Task[] } | undefined) => {
        if (!currentData?.tasks) return currentData;
        return {
          ...currentData,
          tasks: currentData.tasks.map((t) =>
            t.id === updatedTask.id ? updatedTask : t
          ),
        };
      },
      { revalidate: false }
    );
  };

  const renderColumn = (colId: string) => {
    const colTasks = tasks.filter(t => t.status === colId);
    
    return (
      <div className="flex flex-col gap-4">
        {colTasks.length === 0 ? (
          <div className="border border-dashed border-brand-border/50 rounded-sm p-8 flex flex-col items-center justify-center text-brand-text/30 text-center">
            <CopyPlus size={24} className="mb-2 opacity-50" />
            <span className="text-sm font-bebas tracking-wide">No tasks</span>
          </div>
        ) : (
          colTasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
          ))
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 font-bebas text-xl text-brand-text/50">Loading Tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="mb-8 shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-4xl text-brand-accent mb-1">Company Pipeline</h1>
          <p className="text-brand-text/50 font-bebas text-xl">
            {user?.isManager ? "Viewing all marketing requests." : "Viewing your requested tasks."}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-4">
        <div className="flex gap-6 h-full min-w-max">
          {COLUMNS.map(col => (
            <div key={col.id} className="w-80 flex flex-col h-full bg-brand-bg/50 border border-brand-border rounded-sm">
              <div className={`p-4 border-b border-brand-border flex items-center justify-between shrink-0 ${col.color}`}>
                <h3 className="font-bebas text-2xl tracking-wide">{col.title}</h3>
                <span className="bg-brand-bg text-brand-text/70 text-xs px-2 py-0.5 rounded-sm">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-brand-card/20">
                {renderColumn(col.id)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onUpdate={handleUpdate} 
        />
      )}
    </div>
  );
}
