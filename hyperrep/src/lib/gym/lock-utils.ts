const LOCK_WINDOW_MS = 20 * 60 * 1000; // 20 minutes

/**
 * Check if an individual set log is locked (cannot be edited).
 * A set is locked when:
 *   (a) locked_at is set and current time >= locked_at
 *   (b) A later exercise (higher sort_order) has been completed in same session
 *   (c) The session itself is locked
 */
export function isSetLocked(
  log: { locked_at: string | null; template_exercise_id: string },
  allLogs: { template_exercise_id: string; locked_at: string | null }[],
  templateExerciseSortOrders: Record<string, number>,
  session: { ended_at: string | null; locked_at: string | null } | null
): boolean {
  // Rule (a): own lock expired
  if (log.locked_at && Date.now() >= new Date(log.locked_at).getTime()) {
    return true;
  }

  // Rule (b): a later exercise was completed
  const thisSortOrder = templateExerciseSortOrders[log.template_exercise_id] ?? 0;
  const hasLaterCompleted = allLogs.some((other) => {
    if (other.template_exercise_id === log.template_exercise_id) return false;
    const otherSort = templateExerciseSortOrders[other.template_exercise_id] ?? 0;
    return otherSort > thisSortOrder;
  });
  if (hasLaterCompleted) return true;

  // Rule (c): session is locked
  if (session && isSessionLocked(session)) return true;

  return false;
}

/**
 * Check if a session is locked (no edits allowed at all).
 * A session is locked when ended_at is set AND current time >= ended_at + 20 minutes.
 */
export function isSessionLocked(
  session: { ended_at: string | null; locked_at: string | null }
): boolean {
  if (session.locked_at && Date.now() >= new Date(session.locked_at).getTime()) {
    return true;
  }
  if (session.ended_at) {
    const lockTime = new Date(session.ended_at).getTime() + LOCK_WINDOW_MS;
    return Date.now() >= lockTime;
  }
  return false;
}

/**
 * Get milliseconds remaining until a lock time.
 * Returns 0 if already locked.
 */
export function getTimeRemaining(lockAt: string): number {
  const diff = new Date(lockAt).getTime() - Date.now();
  return Math.max(0, diff);
}

/**
 * Format milliseconds as MM:SS
 */
export function formatLockTime(ms: number): string {
  const totalSecs = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export { LOCK_WINDOW_MS };
