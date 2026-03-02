"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, PlusCircle, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: ListTodo },
    { name: "New Request", href: "/new", icon: PlusCircle },
  ];

  return (
    <aside className="h-full bg-brand-bg w-16 hover:w-56 overflow-hidden border-r border-brand-border flex flex-col transition-all duration-300 group z-50 flex-shrink-0">
      <div className="flex bg-brand-accent/10 items-center justify-center h-16 w-full flex-shrink-0 border-b border-brand-border">
        <span className="text-brand-accent font-bebas text-xl opacity-0 group-hover:opacity-100 transition-opacity">GHOSTBOND</span>
        <span className="text-brand-accent font-bebas text-xl absolute group-hover:opacity-0 transition-opacity">GB</span>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center w-full px-5 py-3 hover:bg-brand-card transition-colors ${
                isActive ? "text-brand-accent border-r-4 border-brand-accent bg-brand-card/50" : "text-brand-text/70"
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="ml-4 font-bebas text-xl uppercase tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-brand-border flex flex-col items-center group-hover:items-start transition-all">
        {user?.picture && (
          <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:block" />
        )}
        <button
          onClick={logout}
          className="flex items-center text-brand-text/50 hover:text-brand-danger transition-colors w-full px-1"
          title="Sign out"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className="ml-4 font-bebas text-lg uppercase tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Sign out
          </span>
        </button>
      </div>
    </aside>
  );
}
