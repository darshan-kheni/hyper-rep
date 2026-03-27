import Link from "next/link";
import { Dumbbell, Pill, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/gym/ThemeToggle";

export default function GymLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg-primary">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/gym" className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight">
              <span className="text-accent">HYPER</span>REP
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-primary">
        <div className="mx-auto flex max-w-2xl">
          <Link
            href="/gym"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-bold text-text-muted transition-colors hover:text-accent"
          >
            <Dumbbell size={20} />
            Workout
          </Link>
          <Link
            href="/gym/supplements"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-bold text-text-muted transition-colors hover:text-accent"
          >
            <Pill size={20} />
            Supplements
          </Link>
          <Link
            href="/gym/settings"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-bold text-text-muted transition-colors hover:text-accent"
          >
            <Settings size={20} />
            Settings
          </Link>
        </div>
      </nav>
    </div>
  );
}
