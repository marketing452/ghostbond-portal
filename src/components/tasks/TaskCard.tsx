"use client";

import type { Task } from "@/types/task";
import { format } from "date-fns";
import { Calendar, Tag } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div 
      onClick={() => onClick(task)}
      className="bg-brand-card/80 border border-brand-border p-4 rounded-sm shadow-md cursor-pointer hover:border-brand-accent/50 hover:bg-brand-card transition-all group"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bebas text-xl text-brand-text group-hover:text-brand-accent transition-colors pr-2">
          {task.name}
        </h4>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {task.channel.map(c => (
          <span key={c} className="text-[10px] bg-brand-bg border border-brand-border px-1.5 py-0.5 text-brand-text/70 uppercase tracking-wide">
            {c}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-brand-text/50">
        <div className="flex flex-col gap-1">
          {task.assignedTo?.length > 0 ? (
            <span className="truncate max-w-[120px]">
              👤 {task.assignedTo[0].split('@')[0]}
            </span>
          ) : (
            <span>👤 Unassigned</span>
          )}
        </div>
        
        {task.dueDate && (
          <div className="flex items-center">
            <Calendar size={12} className="mr-1" />
            <span>{format(new Date(task.dueDate), "MMM d")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
