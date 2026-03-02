"use client";

import { useTasksPolling } from "@/hooks/useTasksPolling";
import { useAuth } from "@/components/auth/AuthContext";
import Link from "next/link";
import { PlusCircle, Activity, CheckCircle2, ListTodo } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const { tasks, isLoading } = useTasksPolling();

  const stats = {
    total: tasks.length,
    inBacklog: tasks.filter(t => t.status === "Backlogs").length,
    inProgress: tasks.filter(t => t.status === "In progress").length,
    done: tasks.filter(t => t.status === "Done").length,
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 font-bebas text-xl text-brand-text/50">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-5xl text-brand-accent mb-2">Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
        <p className="text-xl text-brand-text/70 font-bebas tracking-wide">
          {user?.isManager ? "Here's the company-wide marketing pipeline overview." : "Here's a summary of your requested marketing tasks."}
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-card border border-brand-border p-6 rounded-sm flex items-center shadow-lg">
          <div className="bg-brand-accent/20 p-4 rounded-full text-brand-accent shrink-0">
            <ListTodo size={32} />
          </div>
          <div className="ml-6">
            <h3 className="font-bebas text-2xl text-brand-text/70 mb-1">Total Requests</h3>
            <p className="text-4xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-sm flex items-center shadow-lg">
          <div className="bg-brand-accent/10 p-4 rounded-full text-brand-accent/70 shrink-0">
            <Activity size={32} />
          </div>
          <div className="ml-6">
            <h3 className="font-bebas text-2xl text-brand-text/70 mb-1">In Backlog</h3>
            <p className="text-4xl font-bold">{stats.inBacklog}</p>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-sm flex items-center shadow-lg">
          <div className="bg-brand-info/20 p-4 rounded-full text-brand-info shrink-0">
            <Activity size={32} />
          </div>
          <div className="ml-6">
            <h3 className="font-bebas text-2xl text-brand-text/70 mb-1">In Progress</h3>
            <p className="text-4xl font-bold">{stats.inProgress}</p>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-sm flex items-center shadow-lg">
          <div className="bg-brand-success/20 p-4 rounded-full text-brand-success shrink-0">
            <CheckCircle2 size={32} />
          </div>
          <div className="ml-6">
            <h3 className="font-bebas text-2xl text-brand-text/70 mb-1">Completed</h3>
            <p className="text-4xl font-bold">{stats.done}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <Link href="/new" className="inline-flex items-center btn-primary">
          <PlusCircle size={24} className="mr-3" />
          Submit a New Request
        </Link>
      </section>
    </div>
  );
}
