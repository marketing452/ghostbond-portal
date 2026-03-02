"use client";

import { useAuth } from "../auth/AuthContext";
import LoginScreen from "../auth/LoginScreen";
import Sidebar from "./Sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <div className="h-screen w-screen bg-brand-bg flex items-center justify-center text-brand-accent font-bebas text-2xl">Loading...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen w-full bg-brand-bg text-brand-text overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg/50 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-card/20 to-transparent pointer-events-none" />
        <div className="relative z-10 p-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
