// 4-week periodized program matching hyperrep-prototype.jsx
// Exercises CHANGE across weeks:
// W1-2: Machine-based foundation
// W3: Cables & dumbbells introduced
// W4: Back on machines, heavy strength test

type ExerciseEntry = {
  exerciseName: string;
  sets: number;
  reps: string;
  targetWeight: string;
  restSeconds: number;
  notes: string;
  sortOrder: number;
};

type DayTemplate = {
  dayOfWeek: number; // 1=Mon ... 7=Sun
  title: string;
  focus: string;
  isRestDay: boolean;
  exercises: ExerciseEntry[];
};

type WeekTemplate = {
  week: number;
  label: string;
  subtitle: string;
  days: DayTemplate[];
};

export type ProgramData = {
  name: string;
  description: string;
  weeks: number;
  daysPerWeek: number;
  schedule: WeekTemplate[];
};

const e = (
  name: string,
  sets: number,
  reps: string,
  weight: string,
  rest: number,
  notes: string,
  order: number
): ExerciseEntry => ({
  exerciseName: name,
  sets,
  reps,
  targetWeight: weight,
  restSeconds: rest,
  notes,
  sortOrder: order,
});

export const DEFAULT_PROGRAM: ProgramData = {
  name: "Month 1 — Foundation to Strength",
  description:
    "4-week progressive program. W1-2 machines, W3 cables/dumbbells, W4 strength test.",
  weeks: 4,
  daysPerWeek: 5,
  schedule: [
    // ══════════════════════════════════════════════
    // WEEK 1 — FOUNDATION
    // ══════════════════════════════════════════════
    {
      week: 1,
      label: "WEEK 1 — FOUNDATION",
      subtitle: "Machine-based. Learn movements. Build the habit.",
      days: [
        {
          dayOfWeek: 1,
          title: "Push Day",
          focus: "Chest · Shoulders · Triceps",
          isRestDay: false,
          exercises: [
            e("Chest Press Machine", 3, "12", "30 lbs", 60, "Keep shoulder blades pinched back", 1),
            e("Incline Chest Press Machine", 3, "12", "25 lbs", 60, "Upper chest focus, controlled reps", 2),
            e("Shoulder Press Machine", 3, "10", "20 lbs", 60, "Don't flare elbows past 45°", 3),
            e("Tricep Pushdown", 3, "12", "20 lbs", 45, "Lock elbows at your sides", 4),
            e("Plank", 3, "20s", "BW", 30, "Squeeze glutes, keep hips level", 5),
          ],
        },
        {
          dayOfWeek: 2,
          title: "Pull Day",
          focus: "Back · Biceps",
          isRestDay: false,
          exercises: [
            e("Seated Row Machine", 3, "12", "40 lbs", 60, "Pull to lower chest, squeeze back", 1),
            e("Lat Pulldown", 3, "12", "30 lbs", 60, "Wide grip, slight lean back", 2),
            e("Cable Face Pull", 3, "15", "15 lbs", 45, "Pull to forehead — posture fix", 3),
            e("Bicep Curl Machine", 3, "12", "20 lbs", 45, "Slow controlled reps, no swinging", 4),
            e("Plank", 3, "20s", "BW", 30, "Core engaged throughout", 5),
          ],
        },
        {
          dayOfWeek: 3,
          title: "Upper Body",
          focus: "Chest · Back · Shoulders",
          isRestDay: false,
          exercises: [
            e("Chest Press Machine", 3, "12", "30 lbs", 60, "Tempo: 2s down, 1s up", 1),
            e("Seated Row Machine", 3, "12", "40 lbs", 60, "Strict form, no momentum", 2),
            e("Shoulder Press Machine", 3, "10", "20 lbs", 60, "Full lockout at top", 3),
            e("Lat Pulldown", 3, "10", "30 lbs", 60, "Mind-muscle connection", 4),
            e("Plank", 3, "25s", "BW", 30, "Core is the foundation", 5),
          ],
        },
        {
          dayOfWeek: 4,
          title: "Shoulders & Arms",
          focus: "Delts · Biceps · Triceps",
          isRestDay: false,
          exercises: [
            e("Shoulder Press Machine", 3, "10", "20 lbs", 60, "Strict pressing", 1),
            e("Lateral Raise Machine", 3, "12", "10 lbs", 45, "Side delts — go light W1", 2),
            e("Cable Face Pull", 3, "15", "15 lbs", 45, "Rear delts + posture", 3),
            e("Bicep Curl Machine", 3, "12", "20 lbs", 45, "Slow, controlled", 4),
            e("Tricep Pushdown", 3, "12", "20 lbs", 45, "Elbows locked at sides", 5),
          ],
        },
        {
          dayOfWeek: 5,
          title: "Leg Day",
          focus: "Quads · Hamstrings · Glutes · Core",
          isRestDay: false,
          exercises: [
            e("Leg Press", 3, "12", "50 lbs", 60, "Full range of motion", 1),
            e("Leg Extension", 3, "12", "25 lbs", 60, "Squeeze quads at top", 2),
            e("Leg Curl", 3, "12", "25 lbs", 60, "Control the negative", 3),
            e("Calf Raises", 3, "15", "BW", 30, "Full range on step", 4),
            e("Plank", 3, "25s", "BW", 30, "Breathe steady", 5),
          ],
        },
        {
          dayOfWeek: 6,
          title: "Full Rest",
          focus: "Recovery — Legs Need It",
          isRestDay: true,
          exercises: [],
        },
        {
          dayOfWeek: 7,
          title: "Active Recovery",
          focus: "Pushup Pyramid + Stretch",
          isRestDay: false,
          exercises: [
            e("Pushups", 1, "5", "BW", 30, "Warm-up — perfect form", 1),
            e("Pushups", 1, "10", "BW", 30, "Chest to floor each rep", 2),
            e("Pushups", 1, "15", "BW", 45, "Pyramid peak", 3),
            e("Pushups", 1, "10", "BW", 30, "Coming back down", 4),
            e("Pushups", 1, "5", "BW", 0, "Done. 45 total.", 5),
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════
    // WEEK 2 — ADAPT
    // ══════════════════════════════════════════════
    {
      week: 2,
      label: "WEEK 2 — ADAPT",
      subtitle: "Add weight. Add exercises. Creatine building up.",
      days: [
        {
          dayOfWeek: 1,
          title: "Push Day",
          focus: "Chest · Shoulders · Triceps",
          isRestDay: false,
          exercises: [
            e("Chest Press Machine", 3, "12", "40 lbs", 60, "+10 lbs from W1", 1),
            e("Incline Chest Press Machine", 3, "12", "30 lbs", 60, "+5 lbs", 2),
            e("Shoulder Press Machine", 3, "10", "25 lbs", 60, "+5 lbs", 3),
            e("Lateral Raise Machine", 3, "12", "10 lbs", 45, "NEW — side delts", 4),
            e("Tricep Pushdown", 3, "12", "25 lbs", 45, "+5 lbs", 5),
            e("Plank", 3, "30s", "BW", 30, "Hold strong", 6),
          ],
        },
        {
          dayOfWeek: 2,
          title: "Pull Day",
          focus: "Back · Biceps",
          isRestDay: false,
          exercises: [
            e("Seated Row Machine", 3, "12", "50 lbs", 60, "+10 lbs", 1),
            e("Lat Pulldown", 3, "12", "35 lbs", 60, "+5 lbs", 2),
            e("Cable Face Pull", 3, "15", "20 lbs", 45, "+5 lbs", 3),
            e("Bicep Curl Machine", 3, "12", "25 lbs", 45, "+5 lbs", 4),
            e("Reverse Fly Machine", 3, "12", "15 lbs", 45, "NEW — rear delts", 5),
            e("Plank", 3, "30s", "BW", 30, "Steady", 6),
          ],
        },
        {
          dayOfWeek: 3,
          title: "Upper Body",
          focus: "Chest · Back · Arms",
          isRestDay: false,
          exercises: [
            e("Chest Press Machine", 3, "12", "40 lbs", 60, "Getting natural", 1),
            e("Seated Row Machine", 3, "12", "50 lbs", 60, "Squeeze at peak", 2),
            e("Shoulder Press Machine", 3, "10", "25 lbs", 60, "Consistent", 3),
            e("Lat Pulldown", 3, "10", "35 lbs", 60, "Upper chest pull", 4),
            e("Tricep Pushdown", 3, "12", "25 lbs", 45, "Elbows locked", 5),
            e("Bicep Curl Machine", 3, "12", "25 lbs", 45, "Full range", 6),
          ],
        },
        {
          dayOfWeek: 4,
          title: "Shoulders & Arms",
          focus: "Delts · Biceps · Triceps",
          isRestDay: false,
          exercises: [
            e("Shoulder Press Machine", 3, "10", "25 lbs", 60, "+5 lbs", 1),
            e("Lateral Raise Machine", 3, "12", "10 lbs", 45, "Side delts", 2),
            e("Cable Face Pull", 3, "15", "20 lbs", 45, "+5 lbs", 3),
            e("Preacher Curl Machine", 3, "12", "20 lbs", 45, "NEW — strict bicep isolation", 4),
            e("Tricep Dip Machine", 3, "12", "30 lbs", 45, "NEW — compound tricep", 5),
          ],
        },
        {
          dayOfWeek: 5,
          title: "Leg Day",
          focus: "Quads · Hamstrings · Glutes",
          isRestDay: false,
          exercises: [
            e("Leg Press", 3, "12", "65 lbs", 60, "+15 lbs from W1", 1),
            e("Leg Extension", 3, "12", "30 lbs", 60, "+5 lbs", 2),
            e("Leg Curl", 3, "12", "30 lbs", 60, "+5 lbs", 3),
            e("Hip Adductor", 3, "12", "30 lbs", 45, "NEW — inner thigh", 4),
            e("Calf Raises", 3, "15", "BW", 30, "Pause at top", 5),
            e("Plank", 3, "35s", "BW", 30, "Push to 35s", 6),
          ],
        },
        {
          dayOfWeek: 6,
          title: "Full Rest",
          focus: "Leg Recovery Day",
          isRestDay: true,
          exercises: [],
        },
        {
          dayOfWeek: 7,
          title: "Active Recovery",
          focus: "Pushup Pyramid + Stretch",
          isRestDay: false,
          exercises: [
            e("Pushups", 1, "10", "BW", 30, "+5 from W1", 1),
            e("Pushups", 1, "15", "BW", 30, "+5", 2),
            e("Pushups", 1, "20", "BW", 45, "Peak — 20 reps", 3),
            e("Pushups", 1, "15", "BW", 30, "Coming down", 4),
            e("Pushups", 1, "10", "BW", 0, "70 total. +25 from W1.", 5),
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════
    // WEEK 3 — PUSH HARDER
    // ══════════════════════════════════════════════
    {
      week: 3,
      label: "WEEK 3 — PUSH HARDER",
      subtitle: "Cables & dumbbells introduced. Creatine saturated.",
      days: [
        {
          dayOfWeek: 1,
          title: "Push Day",
          focus: "Chest · Shoulders · Triceps",
          isRestDay: false,
          exercises: [
            e("Dumbbell Bench Press", 4, "10", "25 lbs ea", 60, "NEW — dumbbell bench. Greater ROM than machine.", 1),
            e("Cable Crossover", 3, "12", "15 lbs", 45, "NEW — cable. Squeeze at bottom.", 2),
            e("Dumbbell Shoulder Press", 3, "10", "20 lbs ea", 60, "NEW — dumbbell. More stabilizer work.", 3),
            e("Lateral Raise Machine", 3, "12", "15 lbs", 45, "+5 lbs", 4),
            e("Tricep Rope Pushdown", 3, "12", "25 lbs", 45, "NEW — rope. Spread at bottom for lateral head.", 5),
            e("Plank", 3, "35s", "BW", 30, "Almost 40s", 6),
          ],
        },
        {
          dayOfWeek: 2,
          title: "Pull Day",
          focus: "Back · Biceps · Rear Delts",
          isRestDay: false,
          exercises: [
            e("Cable Row", 4, "10", "50 lbs", 60, "NEW — cable row. Keep torso still.", 1),
            e("Wide-Grip Lat Pulldown", 4, "10", "35 lbs", 60, "NEW — wide grip. Outer lat focus.", 2),
            e("Cable Face Pull", 3, "15", "25 lbs", 45, "Posture", 3),
            e("Dumbbell Hammer Curl", 3, "10", "15 lbs ea", 45, "NEW — dumbbell. Arm thickness.", 4),
            e("Reverse Fly Machine", 3, "12", "20 lbs", 45, "+5 lbs", 5),
          ],
        },
        {
          dayOfWeek: 3,
          title: "Upper Body",
          focus: "Chest · Back · Shoulders",
          isRestDay: false,
          exercises: [
            e("Dumbbell Bench Press", 3, "10", "25 lbs ea", 60, "DB bench getting comfortable", 1),
            e("Cable Row", 3, "10", "50 lbs", 60, "Cable row form check", 2),
            e("Dumbbell Shoulder Press", 3, "10", "20 lbs ea", 60, "Stabilizers adapting", 3),
            e("Lat Pulldown", 3, "10", "40 lbs", 60, "Strong pull", 4),
            e("Plank", 3, "40s", "BW", 30, "Almost 45s", 5),
          ],
        },
        {
          dayOfWeek: 4,
          title: "Shoulders & Arms",
          focus: "Delts · Biceps · Triceps",
          isRestDay: false,
          exercises: [
            e("Dumbbell Shoulder Press", 4, "10", "20 lbs ea", 60, "4 sets — volume up", 1),
            e("Cable Lateral Raise", 3, "12", "10 lbs", 45, "NEW — cable. Constant tension.", 2),
            e("Cable Face Pull", 3, "15", "25 lbs", 45, "Rear delts", 3),
            e("Incline Dumbbell Curl", 3, "10", "12 lbs ea", 45, "NEW — full stretch at bottom", 4),
            e("Cable Overhead Tricep Extension", 3, "12", "20 lbs", 45, "NEW — cable overhead. Long head stretch.", 5),
          ],
        },
        {
          dayOfWeek: 5,
          title: "Leg Day",
          focus: "Quads · Hamstrings · Glutes",
          isRestDay: false,
          exercises: [
            e("Leg Press", 4, "10", "80 lbs", 90, "4 sets, heavier — longer rest", 1),
            e("Goblet Squat", 3, "10", "20 lbs", 60, "NEW — dumbbell squat pattern", 2),
            e("Leg Curl", 3, "12", "35 lbs", 60, "+5 lbs", 3),
            e("Leg Extension", 3, "12", "35 lbs", 60, "+5 lbs", 4),
            e("Hip Adductor", 3, "12", "35 lbs", 45, "+5 lbs", 5),
            e("Plank", 3, "40s", "BW", 30, "Almost 45s", 6),
          ],
        },
        {
          dayOfWeek: 6,
          title: "Full Rest",
          focus: "Leg Recovery",
          isRestDay: true,
          exercises: [],
        },
        {
          dayOfWeek: 7,
          title: "Active Recovery",
          focus: "Pushup Pyramid + Stretch",
          isRestDay: false,
          exercises: [
            e("Pushups", 1, "10", "BW", 30, "Warm up", 1),
            e("Pushups", 1, "15", "BW", 30, "Building", 2),
            e("Pushups", 1, "20", "BW", 45, "Peak", 3),
            e("Pushups", 1, "15", "BW", 30, "Down", 4),
            e("Pushups", 1, "10", "BW", 0, "70 total. Consistent.", 5),
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════
    // WEEK 4 — PROVE IT
    // ══════════════════════════════════════════════
    {
      week: 4,
      label: "WEEK 4 — PROVE IT",
      subtitle: "Strength test. Back on machines. Heavier than ever.",
      days: [
        {
          dayOfWeek: 1,
          title: "Push — Heavy",
          focus: "Chest · Shoulders · Triceps",
          isRestDay: false,
          exercises: [
            e("Chest Press Machine", 4, "8", "50 lbs", 90, "Back on machine — started at 30. +67%.", 1),
            e("Incline Dumbbell Press", 3, "8", "30 lbs ea", 90, "Heavy incline DB", 2),
            e("Shoulder Press Machine", 3, "8", "35 lbs", 90, "Started at 20. +75%.", 3),
            e("Arnold Press", 3, "10", "15 lbs ea", 60, "NEW — hits all 3 delt heads", 4),
            e("Tricep Pushdown", 3, "10", "35 lbs", 45, "Heavy", 5),
            e("Plank", 3, "45s", "BW", 30, "45s — you made it", 6),
          ],
        },
        {
          dayOfWeek: 2,
          title: "Pull — Heavy",
          focus: "Back · Biceps",
          isRestDay: false,
          exercises: [
            e("Seated Row Machine", 4, "8", "65 lbs", 90, "Back on machine — started at 40. +60%.", 1),
            e("Close-Grip Lat Pulldown", 4, "8", "40 lbs", 90, "NEW — close grip for thickness", 2),
            e("Cable Face Pull", 3, "15", "30 lbs", 45, "Doubled from W1", 3),
            e("EZ Bar Curl", 4, "10", "30 lbs", 45, "NEW — EZ bar. Wrist-friendly.", 4),
            e("Reverse Fly Machine", 3, "12", "25 lbs", 45, "Strong rear delts", 5),
          ],
        },
        {
          dayOfWeek: 3,
          title: "Upper — Heavy",
          focus: "Chest · Back · Shoulders",
          isRestDay: false,
          exercises: [
            e("Chest Press Machine", 4, "8", "50 lbs", 90, "Max weight", 1),
            e("Seated Row Machine", 4, "8", "65 lbs", 90, "Heaviest pull", 2),
            e("Shoulder Press Machine", 3, "8", "35 lbs", 90, "Strong", 3),
            e("Lat Pulldown", 3, "10", "45 lbs", 60, "Full back engagement", 4),
            e("Plank", 3, "45s", "BW", 30, "Rock solid", 5),
          ],
        },
        {
          dayOfWeek: 4,
          title: "Arms & Shoulders — Heavy",
          focus: "Delts · Bi · Tri",
          isRestDay: false,
          exercises: [
            e("Shoulder Press Machine", 4, "8", "35 lbs", 90, "Heavy shoulders", 1),
            e("Lateral Raise Machine", 3, "12", "20 lbs", 45, "Doubled from W2", 2),
            e("Cable Face Pull", 3, "15", "30 lbs", 45, "Rear delts", 3),
            e("EZ Bar Curl", 4, "10", "30 lbs", 45, "4 sets — arm day", 4),
            e("Tricep Pushdown", 4, "10", "35 lbs", 45, "4 sets heavy", 5),
          ],
        },
        {
          dayOfWeek: 5,
          title: "Leg Day — Heavy",
          focus: "Quads · Hamstrings · Core",
          isRestDay: false,
          exercises: [
            e("Leg Press", 4, "8", "100 lbs", 90, "DOUBLED from W1. Started at 50.", 1),
            e("Leg Extension", 3, "10", "40 lbs", 60, "Squeeze hard", 2),
            e("Leg Curl", 3, "10", "40 lbs", 60, "Control eccentric", 3),
            e("Hip Adductor", 3, "12", "40 lbs", 45, "Strong", 4),
            e("Calf Raises", 3, "20", "BW", 30, "Full range", 5),
            e("Plank", 3, "45s", "BW", 30, "0 → 45s. That's discipline.", 6),
          ],
        },
        {
          dayOfWeek: 6,
          title: "Full Rest",
          focus: "Celebrate & Recover",
          isRestDay: true,
          exercises: [],
        },
        {
          dayOfWeek: 7,
          title: "Active Recovery",
          focus: "Pushup Pyramid + Stretch",
          isRestDay: false,
          exercises: [
            e("Pushups", 1, "15", "BW", 30, "+10 from W1", 1),
            e("Pushups", 1, "20", "BW", 30, "Building", 2),
            e("Pushups", 1, "25", "BW", 45, "Peak — 25", 3),
            e("Pushups", 1, "20", "BW", 30, "Down", 4),
            e("Pushups", 1, "15", "BW", 0, "95 total. Started at 45. +111%.", 5),
          ],
        },
      ],
    },
  ],
};

/**
 * Shift the rest day in the program to a different day of the week.
 * Default rest day is 6 (Saturday). This remaps all dayOfWeek values
 * so the rest day lands on the chosen day while preserving workout order.
 */
export function shiftRestDay(
  program: ProgramData,
  newRestDay: number
): ProgramData {
  const defaultRestDay = 6;
  if (newRestDay === defaultRestDay) return program;

  const delta = newRestDay - defaultRestDay;

  return {
    ...program,
    schedule: program.schedule.map((week) => ({
      ...week,
      days: week.days.map((day) => {
        const shifted = ((day.dayOfWeek - 1 + delta + 7) % 7) + 1;
        return { ...day, dayOfWeek: shifted };
      }),
    })),
  };
}

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
