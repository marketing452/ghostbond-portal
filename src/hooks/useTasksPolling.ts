"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type { Task } from "@/types/task";
import { useAuth } from "@/components/auth/AuthContext";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTasksPolling() {
  const { user } = useAuth();
  
  // Keep track of previous tasks to compare for notifications
  const previousTasksRef = useRef<Record<string, Task>>({});

  const { data, error, isLoading, mutate } = useSWR<{ tasks: Task[] }>(
    user?.email ? `/api/tasks?email=${encodeURIComponent(user.email)}` : null,
    fetcher,
    {
      refreshInterval: 10000, // Poll every 10 seconds
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    if (!data?.tasks) return;

    const currentTasks = data.tasks;
    const prevMap = previousTasksRef.current;
    
    // Only show notifications if we've already loaded the tasks at least once
    if (Object.keys(prevMap).length > 0) {
      currentTasks.forEach((task: Task) => {
        const prevTask = prevMap[task.id];
        
        // If it's a completely new task (and we aren't just initially loading)
        if (!prevTask) {
           toast.success(`New Task Created`, {
              description: task.title,
           });
           return;
        }

        // If the task status changed
        if (prevTask.status !== task.status) {
          toast.info(`Task Status Updated`, {
            description: `"${task.title}" is now ${task.status}`,
          });
        }
      });
    }

    // Update the ref map for the next comparison
    const newMap: Record<string, Task> = {};
    currentTasks.forEach((t: Task) => newMap[t.id] = t);
    previousTasksRef.current = newMap;
    
  }, [data?.tasks]);

  return {
    tasks: data?.tasks || [],
    isLoading,
    isError: error,
    mutateTasks: mutate,
  };
}
