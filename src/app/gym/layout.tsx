import Link from "next/link";
import { Dumbbell, Bot, Users, Clock, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/gym/ThemeToggle";

export default function GymLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary">
      {/* Header — glass morphism */}
      <header className="sticky top-0 z-50 bg-bg-primary/70 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/gym" className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight">
              <span className="text-accent drop-shadow-[0_0_8px_var(--color-accent-glow)]">
                HYPER
              </span>
              <span className="text-text-primary">REP</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">{children}</main>

      {/* Bottom nav — glass morphism + safe area */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-primary/70 backdrop-blur-xl shadow-[0_-1px_3px_rgba(0,0,0,0.06),0_-4px_12px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl">
          <Link
            href="/gym"
            className="group flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold text-text-muted transition-all duration-200 hover:text-accent"
          >
            <div className="relative flex items-center justify-center">
              <Dumbbell size={20} className="relative z-10 transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute -inset-1.5 rounded-full bg-accent-glow opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
            Workout
          </Link>
          <Link
            href="/gym/ai"
            className="group flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold text-text-muted transition-all duration-200 hover:text-accent"
          >
            <div className="relative flex items-center justify-center">
              <Bot size={20} className="relative z-10 transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute -inset-1.5 rounded-full bg-accent-glow opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
            AI Coach
          </Link>
          <Link
            href="/gym/groups"
            className="group flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold text-text-muted transition-all duration-200 hover:text-accent"
          >
            <div className="relative flex items-center justify-center">
              <Users size={20} className="relative z-10 transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute -inset-1.5 rounded-full bg-accent-glow opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
            Groups
          </Link>
          <Link
            href="/gym/history"
            className="group flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold text-text-muted transition-all duration-200 hover:text-accent"
          >
            <div className="relative flex items-center justify-center">
              <Clock size={20} className="relative z-10 transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute -inset-1.5 rounded-full bg-accent-glow opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
            History
          </Link>
          <Link
            href="/gym/settings"
            className="group flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold text-text-muted transition-all duration-200 hover:text-accent"
          >
            <div className="relative flex items-center justify-center">
              <Settings size={20} className="relative z-10 transition-transform duration-200 group-hover:scale-110" />
              <div className="absolute -inset-1.5 rounded-full bg-accent-glow opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
            Settings
          </Link>
        </div>
      </nav>
    </div>
  );
}
