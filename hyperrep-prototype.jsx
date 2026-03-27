import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   HYPERREP — Complete JSX Prototype
   UI reference for Claude Code implementation
   Theme: Black & Electric Blue
   ═══════════════════════════════════════════════════════════ */

// ─── EXERCISE LIBRARY (dynamic across weeks) ───
const EX = {
  // Chest
  chestPressMachine: { name: "Chest Press Machine", group: "Chest", equip: "Machine" },
  inclineChestMachine: { name: "Incline Chest Press Machine", group: "Chest", equip: "Machine" },
  dbBenchPress: { name: "Dumbbell Bench Press", group: "Chest", equip: "Dumbbell" },
  cableCrossover: { name: "Cable Crossover", group: "Chest", equip: "Cable" },
  inclineDbPress: { name: "Incline Dumbbell Press", group: "Chest", equip: "Dumbbell" },
  // Back
  seatedRowMachine: { name: "Seated Row Machine", group: "Back", equip: "Machine" },
  latPulldown: { name: "Lat Pulldown", group: "Back", equip: "Cable" },
  cableRow: { name: "Cable Row", group: "Back", equip: "Cable" },
  wideGripLat: { name: "Wide-Grip Lat Pulldown", group: "Back", equip: "Cable" },
  closeGripLat: { name: "Close-Grip Lat Pulldown", group: "Back", equip: "Cable" },
  // Shoulders
  shoulderPressMachine: { name: "Shoulder Press Machine", group: "Shoulders", equip: "Machine" },
  dbShoulderPress: { name: "Dumbbell Shoulder Press", group: "Shoulders", equip: "Dumbbell" },
  latRaiseMachine: { name: "Lateral Raise Machine", group: "Shoulders", equip: "Machine" },
  cableLatRaise: { name: "Cable Lateral Raise", group: "Shoulders", equip: "Cable" },
  facePull: { name: "Cable Face Pull", group: "Shoulders", equip: "Cable" },
  reverseFly: { name: "Reverse Fly Machine", group: "Shoulders", equip: "Machine" },
  arnoldPress: { name: "Arnold Press", group: "Shoulders", equip: "Dumbbell" },
  // Arms
  bicepCurlMachine: { name: "Bicep Curl Machine", group: "Arms", equip: "Machine" },
  preacherCurl: { name: "Preacher Curl Machine", group: "Arms", equip: "Machine" },
  hammerCurl: { name: "Dumbbell Hammer Curl", group: "Arms", equip: "Dumbbell" },
  inclineDbCurl: { name: "Incline Dumbbell Curl", group: "Arms", equip: "Dumbbell" },
  ezBarCurl: { name: "EZ Bar Curl", group: "Arms", equip: "Barbell" },
  tricepPushdown: { name: "Tricep Pushdown", group: "Arms", equip: "Cable" },
  tricepRope: { name: "Tricep Rope Pushdown", group: "Arms", equip: "Cable" },
  tricepDipMachine: { name: "Tricep Dip Machine", group: "Arms", equip: "Machine" },
  tricepOverhead: { name: "Cable Overhead Tricep Ext", group: "Arms", equip: "Cable" },
  // Legs
  legPress: { name: "Leg Press", group: "Legs", equip: "Machine" },
  legExtension: { name: "Leg Extension", group: "Legs", equip: "Machine" },
  legCurl: { name: "Leg Curl", group: "Legs", equip: "Machine" },
  hipAdductor: { name: "Hip Adductor", group: "Legs", equip: "Machine" },
  calfRaises: { name: "Calf Raises", group: "Legs", equip: "Bodyweight" },
  gobletSquat: { name: "Goblet Squat", group: "Legs", equip: "Dumbbell" },
  // Core
  plank: { name: "Plank", group: "Core", equip: "Bodyweight" },
  pushups: { name: "Pushups", group: "Chest", equip: "Bodyweight" },
  stretch: { name: "Full Body Stretch", group: "Recovery", equip: "Bodyweight" },
};

const e = (ex, sets, reps, weight, rest, notes) => ({ ...ex, sets, reps, weight, rest, notes });

// ─── 4-WEEK DYNAMIC PROGRAM ───
const PROGRAM = {
  name: "Month 1 — Foundation to Strength",
  weeks: [
    { label: "WEEK 1 — FOUNDATION", sub: "Machine-based. Learn movements. Build the habit.", days: [
      { day: "Monday", title: "Push Day", focus: "Chest · Shoulders · Triceps", exercises: [
        e(EX.chestPressMachine, 3, "12", "30 lbs", "60s", "Keep shoulder blades pinched back"),
        e(EX.inclineChestMachine, 3, "12", "25 lbs", "60s", "Upper chest focus, controlled reps"),
        e(EX.shoulderPressMachine, 3, "10", "20 lbs", "60s", "Don't flare elbows past 45°"),
        e(EX.tricepPushdown, 3, "12", "20 lbs", "45s", "Lock elbows at your sides"),
        e(EX.plank, 3, "20s", "BW", "30s", "Squeeze glutes, keep hips level"),
      ]},
      { day: "Tuesday", title: "Pull Day", focus: "Back · Biceps", exercises: [
        e(EX.seatedRowMachine, 3, "12", "40 lbs", "60s", "Pull to lower chest, squeeze back"),
        e(EX.latPulldown, 3, "12", "30 lbs", "60s", "Wide grip, slight lean back"),
        e(EX.facePull, 3, "15", "15 lbs", "45s", "Pull to forehead — posture fix"),
        e(EX.bicepCurlMachine, 3, "12", "20 lbs", "45s", "Slow controlled reps, no swinging"),
        e(EX.plank, 3, "20s", "BW", "30s", "Core engaged throughout"),
      ]},
      { day: "Wednesday", title: "Upper Body", focus: "Chest · Back · Shoulders", exercises: [
        e(EX.chestPressMachine, 3, "12", "30 lbs", "60s", "Tempo: 2s down, 1s up"),
        e(EX.seatedRowMachine, 3, "12", "40 lbs", "60s", "Strict form, no momentum"),
        e(EX.shoulderPressMachine, 3, "10", "20 lbs", "60s", "Full lockout at top"),
        e(EX.latPulldown, 3, "10", "30 lbs", "60s", "Mind-muscle connection"),
        e(EX.plank, 3, "25s", "BW", "30s", "Core is the foundation"),
      ]},
      { day: "Thursday", title: "Shoulders & Arms", focus: "Delts · Biceps · Triceps", exercises: [
        e(EX.shoulderPressMachine, 3, "10", "20 lbs", "60s", "Strict pressing"),
        e(EX.latRaiseMachine, 3, "12", "10 lbs", "45s", "Side delts — go light W1"),
        e(EX.facePull, 3, "15", "15 lbs", "45s", "Rear delts + posture"),
        e(EX.bicepCurlMachine, 3, "12", "20 lbs", "45s", "Slow, controlled"),
        e(EX.tricepPushdown, 3, "12", "20 lbs", "45s", "Elbows locked at sides"),
      ]},
      { day: "Friday", title: "Leg Day", focus: "Quads · Hamstrings · Glutes · Core", exercises: [
        e(EX.legPress, 3, "12", "50 lbs", "60s", "Full range of motion"),
        e(EX.legExtension, 3, "12", "25 lbs", "60s", "Squeeze quads at top"),
        e(EX.legCurl, 3, "12", "25 lbs", "60s", "Control the negative"),
        e(EX.calfRaises, 3, "15", "BW", "30s", "Full range on step"),
        e(EX.plank, 3, "25s", "BW", "30s", "Breathe steady"),
      ]},
      { day: "Saturday", title: "Full Rest", focus: "Recovery — Legs Need It", exercises: [] },
      { day: "Sunday", title: "Active Recovery", focus: "Pushup Pyramid + Stretch", exercises: [
        e(EX.pushups, 1, "5", "BW", "30s", "Warm-up — perfect form"),
        e(EX.pushups, 1, "10", "BW", "30s", "Chest to floor each rep"),
        e(EX.pushups, 1, "15", "BW", "45s", "Pyramid peak"),
        e(EX.pushups, 1, "10", "BW", "30s", "Coming back down"),
        e(EX.pushups, 1, "5", "BW", "—", "Done. 45 total."),
        e(EX.stretch, 1, "10 min", "BW", "—", "Chest, shoulders, quads, hams, hips"),
      ]},
    ]},
    { label: "WEEK 2 — ADAPT", sub: "Add weight. Add exercises. Creatine building up.", days: [
      { day: "Monday", title: "Push Day", focus: "Chest · Shoulders · Triceps", exercises: [
        e(EX.chestPressMachine, 3, "12", "40 lbs", "60s", "+10 lbs from W1"),
        e(EX.inclineChestMachine, 3, "12", "30 lbs", "60s", "+5 lbs"),
        e(EX.shoulderPressMachine, 3, "10", "25 lbs", "60s", "+5 lbs"),
        e(EX.latRaiseMachine, 3, "12", "10 lbs", "45s", "NEW — side delts"),
        e(EX.tricepPushdown, 3, "12", "25 lbs", "45s", "+5 lbs"),
        e(EX.plank, 3, "30s", "BW", "30s", "Hold strong"),
      ]},
      { day: "Tuesday", title: "Pull Day", focus: "Back · Biceps", exercises: [
        e(EX.seatedRowMachine, 3, "12", "50 lbs", "60s", "+10 lbs"),
        e(EX.latPulldown, 3, "12", "35 lbs", "60s", "+5 lbs"),
        e(EX.facePull, 3, "15", "20 lbs", "45s", "+5 lbs"),
        e(EX.bicepCurlMachine, 3, "12", "25 lbs", "45s", "+5 lbs"),
        e(EX.reverseFly, 3, "12", "15 lbs", "45s", "NEW — rear delts"),
        e(EX.plank, 3, "30s", "BW", "30s", "Steady"),
      ]},
      { day: "Wednesday", title: "Upper Body", focus: "Chest · Back · Arms", exercises: [
        e(EX.chestPressMachine, 3, "12", "40 lbs", "60s", "Getting natural"),
        e(EX.seatedRowMachine, 3, "12", "50 lbs", "60s", "Squeeze at peak"),
        e(EX.shoulderPressMachine, 3, "10", "25 lbs", "60s", "Consistent"),
        e(EX.latPulldown, 3, "10", "35 lbs", "60s", "Upper chest pull"),
        e(EX.tricepPushdown, 3, "12", "25 lbs", "45s", "Elbows locked"),
        e(EX.bicepCurlMachine, 3, "12", "25 lbs", "45s", "Full range"),
      ]},
      { day: "Thursday", title: "Shoulders & Arms", focus: "Delts · Biceps · Triceps", exercises: [
        e(EX.shoulderPressMachine, 3, "10", "25 lbs", "60s", "+5 lbs"),
        e(EX.latRaiseMachine, 3, "12", "10 lbs", "45s", "Side delts"),
        e(EX.facePull, 3, "15", "20 lbs", "45s", "+5 lbs"),
        e(EX.preacherCurl, 3, "12", "20 lbs", "45s", "NEW — strict bicep isolation"),
        e(EX.tricepDipMachine, 3, "12", "30 lbs", "45s", "NEW — compound tricep"),
      ]},
      { day: "Friday", title: "Leg Day", focus: "Quads · Hamstrings · Glutes", exercises: [
        e(EX.legPress, 3, "12", "65 lbs", "60s", "+15 lbs from W1"),
        e(EX.legExtension, 3, "12", "30 lbs", "60s", "+5 lbs"),
        e(EX.legCurl, 3, "12", "30 lbs", "60s", "+5 lbs"),
        e(EX.hipAdductor, 3, "12", "30 lbs", "45s", "NEW — inner thigh"),
        e(EX.calfRaises, 3, "15", "BW", "30s", "Pause at top"),
        e(EX.plank, 3, "35s", "BW", "30s", "Push to 35s"),
      ]},
      { day: "Saturday", title: "Full Rest", focus: "Leg Recovery Day", exercises: [] },
      { day: "Sunday", title: "Active Recovery", focus: "Pushup Pyramid + Stretch", exercises: [
        e(EX.pushups, 1, "10", "BW", "30s", "+5 from W1"), e(EX.pushups, 1, "15", "BW", "30s", "+5"), e(EX.pushups, 1, "20", "BW", "45s", "Peak — 20 reps"),
        e(EX.pushups, 1, "15", "BW", "30s", "Coming down"), e(EX.pushups, 1, "10", "BW", "—", "70 total. +25 from W1."),
        e(EX.stretch, 1, "10 min", "BW", "—", "Full body"),
      ]},
    ]},
    { label: "WEEK 3 — PUSH HARDER", sub: "Cables & dumbbells introduced. Creatine saturated.", days: [
      { day: "Monday", title: "Push Day", focus: "Chest · Shoulders · Triceps", exercises: [
        e(EX.dbBenchPress, 4, "10", "25 lbs ea", "60s", "NEW — dumbbell bench. Greater ROM than machine."),
        e(EX.cableCrossover, 3, "12", "15 lbs", "45s", "NEW — cable. Squeeze at bottom."),
        e(EX.dbShoulderPress, 3, "10", "20 lbs ea", "60s", "NEW — dumbbell. More stabilizer work."),
        e(EX.latRaiseMachine, 3, "12", "15 lbs", "45s", "+5 lbs"),
        e(EX.tricepRope, 3, "12", "25 lbs", "45s", "NEW — rope. Spread at bottom for lateral head."),
        e(EX.plank, 3, "35s", "BW", "30s", "Almost 40s"),
      ]},
      { day: "Tuesday", title: "Pull Day", focus: "Back · Biceps · Rear Delts", exercises: [
        e(EX.cableRow, 4, "10", "50 lbs", "60s", "NEW — cable row. Keep torso still."),
        e(EX.wideGripLat, 4, "10", "35 lbs", "60s", "NEW — wide grip. Outer lat focus."),
        e(EX.facePull, 3, "15", "25 lbs", "45s", "Posture"),
        e(EX.hammerCurl, 3, "10", "15 lbs ea", "45s", "NEW — dumbbell. Arm thickness."),
        e(EX.reverseFly, 3, "12", "20 lbs", "45s", "+5 lbs"),
      ]},
      { day: "Wednesday", title: "Upper Body", focus: "Chest · Back · Shoulders", exercises: [
        e(EX.dbBenchPress, 3, "10", "25 lbs ea", "60s", "DB bench getting comfortable"),
        e(EX.cableRow, 3, "10", "50 lbs", "60s", "Cable row form check"),
        e(EX.dbShoulderPress, 3, "10", "20 lbs ea", "60s", "Stabilizers adapting"),
        e(EX.latPulldown, 3, "10", "40 lbs", "60s", "Strong pull"),
        e(EX.plank, 3, "40s", "BW", "30s", "Almost 45s"),
      ]},
      { day: "Thursday", title: "Shoulders & Arms", focus: "Delts · Biceps · Triceps", exercises: [
        e(EX.dbShoulderPress, 4, "10", "20 lbs ea", "60s", "4 sets — volume up"),
        e(EX.cableLatRaise, 3, "12", "10 lbs", "45s", "NEW — cable. Constant tension."),
        e(EX.facePull, 3, "15", "25 lbs", "45s", "Rear delts"),
        e(EX.inclineDbCurl, 3, "10", "12 lbs ea", "45s", "NEW — full stretch at bottom"),
        e(EX.tricepOverhead, 3, "12", "20 lbs", "45s", "NEW — cable overhead. Long head stretch."),
      ]},
      { day: "Friday", title: "Leg Day", focus: "Quads · Hamstrings · Glutes", exercises: [
        e(EX.legPress, 4, "10", "80 lbs", "90s", "4 sets, heavier — longer rest"),
        e(EX.gobletSquat, 3, "10", "20 lbs", "60s", "NEW — dumbbell squat pattern"),
        e(EX.legCurl, 3, "12", "35 lbs", "60s", "+5 lbs"),
        e(EX.legExtension, 3, "12", "35 lbs", "60s", "+5 lbs"),
        e(EX.hipAdductor, 3, "12", "35 lbs", "45s", "+5 lbs"),
        e(EX.plank, 3, "40s", "BW", "30s", "Almost 45s"),
      ]},
      { day: "Saturday", title: "Full Rest", focus: "Leg Recovery", exercises: [] },
      { day: "Sunday", title: "Active Recovery", focus: "Pushup Pyramid + Stretch", exercises: [
        e(EX.pushups, 1, "10", "BW", "30s", "Warm up"), e(EX.pushups, 1, "15", "BW", "30s", "Building"), e(EX.pushups, 1, "20", "BW", "45s", "Peak"),
        e(EX.pushups, 1, "15", "BW", "30s", "Down"), e(EX.pushups, 1, "10", "BW", "—", "70 total. Consistent."),
        e(EX.stretch, 1, "10 min", "BW", "—", "Full body"),
      ]},
    ]},
    { label: "WEEK 4 — PROVE IT", sub: "Strength test. Back on machines. Heavier than ever.", days: [
      { day: "Monday", title: "Push — Heavy", focus: "Chest · Shoulders · Triceps", exercises: [
        e(EX.chestPressMachine, 4, "8", "50 lbs", "90s", "Back on machine — started at 30. +67%."),
        e(EX.inclineDbPress, 3, "8", "30 lbs ea", "90s", "Heavy incline DB"),
        e(EX.shoulderPressMachine, 3, "8", "35 lbs", "90s", "Started at 20. +75%."),
        e(EX.arnoldPress, 3, "10", "15 lbs ea", "60s", "NEW — hits all 3 delt heads"),
        e(EX.tricepPushdown, 3, "10", "35 lbs", "45s", "Heavy"),
        e(EX.plank, 3, "45s", "BW", "30s", "45s — you made it"),
      ]},
      { day: "Tuesday", title: "Pull — Heavy", focus: "Back · Biceps", exercises: [
        e(EX.seatedRowMachine, 4, "8", "65 lbs", "90s", "Back on machine — started at 40. +60%."),
        e(EX.closeGripLat, 4, "8", "40 lbs", "90s", "NEW — close grip for thickness"),
        e(EX.facePull, 3, "15", "30 lbs", "45s", "Doubled from W1"),
        e(EX.ezBarCurl, 4, "10", "30 lbs", "45s", "NEW — EZ bar. Wrist-friendly."),
        e(EX.reverseFly, 3, "12", "25 lbs", "45s", "Strong rear delts"),
      ]},
      { day: "Wednesday", title: "Upper — Heavy", focus: "Chest · Back · Shoulders", exercises: [
        e(EX.chestPressMachine, 4, "8", "50 lbs", "90s", "Max weight"),
        e(EX.seatedRowMachine, 4, "8", "65 lbs", "90s", "Heaviest pull"),
        e(EX.shoulderPressMachine, 3, "8", "35 lbs", "90s", "Strong"),
        e(EX.latPulldown, 3, "10", "45 lbs", "60s", "Full back engagement"),
        e(EX.plank, 3, "45s", "BW", "30s", "Rock solid"),
      ]},
      { day: "Thursday", title: "Arms & Shoulders — Heavy", focus: "Delts · Bi · Tri", exercises: [
        e(EX.shoulderPressMachine, 4, "8", "35 lbs", "90s", "Heavy shoulders"),
        e(EX.latRaiseMachine, 3, "12", "20 lbs", "45s", "Doubled from W2"),
        e(EX.facePull, 3, "15", "30 lbs", "45s", "Rear delts"),
        e(EX.ezBarCurl, 4, "10", "30 lbs", "45s", "4 sets — arm day"),
        e(EX.tricepPushdown, 4, "10", "35 lbs", "45s", "4 sets heavy"),
      ]},
      { day: "Friday", title: "Leg Day — Heavy", focus: "Quads · Hamstrings · Core", exercises: [
        e(EX.legPress, 4, "8", "100 lbs", "90s", "DOUBLED from W1. Started at 50."),
        e(EX.legExtension, 3, "10", "40 lbs", "60s", "Squeeze hard"),
        e(EX.legCurl, 3, "10", "40 lbs", "60s", "Control eccentric"),
        e(EX.hipAdductor, 3, "12", "40 lbs", "45s", "Strong"),
        e(EX.calfRaises, 3, "20", "BW", "30s", "Full range"),
        e(EX.plank, 3, "45s", "BW", "30s", "0 → 45s. That's discipline."),
      ]},
      { day: "Saturday", title: "Full Rest", focus: "Celebrate & Recover", exercises: [] },
      { day: "Sunday", title: "Active Recovery", focus: "Pushup Pyramid + Stretch", exercises: [
        e(EX.pushups, 1, "15", "BW", "30s", "+10 from W1"), e(EX.pushups, 1, "20", "BW", "30s", "Building"), e(EX.pushups, 1, "25", "BW", "45s", "Peak — 25"),
        e(EX.pushups, 1, "20", "BW", "30s", "Down"), e(EX.pushups, 1, "15", "BW", "—", "95 total. Started at 45. +111%."),
        e(EX.stretch, 1, "10 min", "BW", "—", "Celebrate. Plan Month 2."),
      ]},
    ]},
  ],
};

// ─── MEAL PLAN (times in correct order) ───
const MEALS_BY_DAY = {
  workout: [
    { key: "breakfast", label: "Breakfast", time: "8:00 AM", suppNote: "5g Creatine + 1 Multivitamin" },
    { key: "lunch", label: "Lunch", time: "1:00 PM", suppNote: null },
    { key: "gainer", label: "Gainer Shake", time: "3:30 PM", suppNote: "Mass Gainer (1 serving + milk) — 2 hrs before gym" },
    { key: "preWorkout", label: "Pre-Workout", time: "5:00 PM", suppNote: "Light — banana + black coffee" },
    { key: "gym", label: "GYM", time: "5:30–6:30 PM", suppNote: null },
    { key: "postWorkout", label: "Post-Workout", time: "~6:45 PM", suppNote: "Whey (1 scoop + milk) — within 30 min" },
    { key: "dinner", label: "Dinner", time: "8:30 PM", suppNote: null },
  ],
  rest: [
    { key: "breakfast", label: "Breakfast", time: "9:00 AM", suppNote: "5g Creatine + 1 Multivitamin" },
    { key: "lunch", label: "Lunch", time: "1:00 PM", suppNote: null },
    { key: "snack", label: "Whey Snack", time: "4:00 PM", suppNote: "Whey (1 scoop + milk) — rest day timing" },
    { key: "dinner", label: "Dinner", time: "8:30 PM", suppNote: null },
  ],
};

// ─── SUPPLEMENT RECOMMENDATIONS ───
const SUPPLEMENTS = [
  { name: "Creatine Monohydrate", brands: "MuscleBlaze Creatine / ON Micronized", dose: "5g/day", when: "With breakfast, every day", why: "Most researched supplement. Only monohydrate is proven. Skip HCL, ethyl ester.", price: "₹500–800 for 250g" },
  { name: "Whey Protein", brands: "MuscleBlaze Biozyme / ON Gold Standard", dose: "1 scoop (~30g protein)", when: "Post-workout / between meals on rest days", why: "Fast-absorbing. Look for >24g protein per scoop, <5g sugar.", price: "₹2000–3500 for 1kg" },
  { name: "Mass Gainer", brands: "MuscleBlaze Super Gainer XXL / ON Serious Mass", dose: "1 serving (~800-1000 cal)", when: "3:30 PM (2 hrs before gym)", why: "Calorie surplus made easy. Choose <40g sugar. Mix with milk.", price: "₹1500–3000 for 1kg" },
  { name: "Multivitamin", brands: "MuscleBlaze MB-Vite / HealthKart HK Vitals", dose: "1 tablet/day", when: "With breakfast", why: "Vegetarians lack B12, D3, Iron, Zinc. Cover the gaps.", price: "₹300–600 for 60 tabs" },
  { name: "Omega-3 (Optional)", brands: "HealthKart Fish Oil / Flaxseed Oil (veg)", dose: "1000mg", when: "With any meal", why: "Joint health, inflammation reduction. Flaxseed if strict veg.", price: "₹400–700 for 60 caps" },
];

// ─── ICONS ───
const Sun = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const Moon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const Check = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const ChR = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const ChL = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const Play = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const Clock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const Pill = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="7" rx="3.5"/><line x1="12" y1="11" x2="12" y2="18"/></svg>;
const Dumbbell = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 5v14M18 5v14M3 8h3M3 16h3M18 8h3M18 16h3M6 8h12M6 16h12"/></svg>;

// ─── MAIN APP ───
export default function HyperRep() {
  const [dark, setDark] = useState(true);
  const [page, setPage] = useState("dashboard"); // dashboard | workout | supps
  const [wk, setWk] = useState(0);
  const [dayI, setDayI] = useState(null);
  const [tab, setTab] = useState("workout");
  const [done, setDone] = useState({});
  const [anim, setAnim] = useState(true);
  const [gymStarted, setGymStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => { setAnim(true); const t = setTimeout(() => setAnim(false), 300); return () => clearTimeout(t); }, [wk, dayI, page]);
  useEffect(() => { setTab("workout"); }, [dayI]);
  useEffect(() => { if (gymStarted) { timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000); } return () => clearInterval(timerRef.current); }, [gymStarted]);

  const c = {
    bg: dark ? "#000" : "#F0F7FF", fg: dark ? "#E8E8E8" : "#0A0A0A", mt: dark ? "#555" : "#6B7B94",
    bd: dark ? "#1A1A1A" : "#C8D8EC", cb: dark ? "#0A0A0A" : "#FFF", ac: dark ? "#00AAFF" : "#0066CC",
    abg: dark ? "#00AAFF" : "#0066CC", afg: dark ? "#000" : "#FFF",
    sb: dark ? "rgba(0,170,255,0.08)" : "rgba(0,102,204,0.06)",
    mb: dark ? "rgba(0,170,255,0.04)" : "rgba(0,102,204,0.03)",
  };

  const week = PROGRAM.weeks[wk];
  const tog = (w, d, ei) => { const k = `${w}-${d}-${ei}`; setDone(p => ({ ...p, [k]: !p[k] })); };
  const dp = (w, d) => { const dy = PROGRAM.weeks[w].days[d]; if (!dy.exercises.length) return -1; let dn = 0; dy.exercises.forEach((_, ei) => { if (done[`${w}-${d}-${ei}`]) dn++; }); return Math.round(dn / dy.exercises.length * 100); };
  const wp = (w) => { let t = 0, d = 0; PROGRAM.weeks[w].days.forEach((dy, di) => dy.exercises.forEach((_, ei) => { t++; if (done[`${w}-${di}-${ei}`]) d++; })); return t ? Math.round(d / t * 100) : 0; };
  const fd = { opacity: anim ? 0 : 1, transform: anim ? "translateY(6px)" : "translateY(0)", transition: "opacity 0.3s, transform 0.3s" };
  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const NavBtn = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{ flex: 1, padding: "10px 0", background: active ? c.abg : "transparent", color: active ? c.afg : c.mt, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</button>
  );

  return (
    <div style={{ fontFamily: "'SF Pro Display',-apple-system,'Helvetica Neue',sans-serif", background: c.bg, color: c.fg, minHeight: "100vh", transition: "background 0.3s, color 0.3s" }}>
      {/* ── HEADER ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: c.bg, borderBottom: `1px solid ${c.bd}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {dayI !== null && page === "dashboard" && <button onClick={() => setDayI(null)} style={{ background: "none", border: "none", color: c.fg, cursor: "pointer", padding: 4, display: "flex" }}><ChL /></button>}
          {page !== "dashboard" && <button onClick={() => setPage("dashboard")} style={{ background: "none", border: "none", color: c.fg, cursor: "pointer", padding: 4, display: "flex" }}><ChL /></button>}
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: c.ac }}>HYPER</span><span>REP</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: c.mt, letterSpacing: "0.1em", marginTop: 1 }}>
              {page === "supps" ? "SUPPLEMENT GUIDE" : gymStarted ? `SESSION: ${fmtTime(elapsed)}` : "60 → 80 KG · GYM 5:30 PM"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {gymStarted && <div style={{ background: c.sb, border: `1px solid ${c.ac}`, borderRadius: 99, padding: "6px 14px", fontSize: 14, fontWeight: 800, color: c.ac, fontVariantNumeric: "tabular-nums" }}>{fmtTime(elapsed)}</div>}
          <button onClick={() => setDark(!dark)} style={{ background: "none", border: `1px solid ${c.bd}`, borderRadius: 99, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: c.fg }}>{dark ? <Sun /> : <Moon />}</button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "14px 16px 100px" }}>

        {/* ── DASHBOARD ── */}
        {page === "dashboard" && dayI === null && <>
          {/* Week tabs */}
          <div style={{ ...fd, display: "flex", gap: 5, marginBottom: 18 }}>
            {PROGRAM.weeks.map((_, i) => (
              <button key={i} onClick={() => setWk(i)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: wk === i ? `2px solid ${c.ac}` : `1px solid ${c.bd}`, background: wk === i ? c.abg : "transparent", color: wk === i ? c.afg : c.mt, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                W{i + 1}{wp(i) > 0 && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>{wp(i)}%</span>}
              </button>
            ))}
          </div>
          <p style={{ ...fd, fontSize: 13, color: c.mt, marginBottom: 14, lineHeight: 1.5 }}>{week.sub}</p>

          {/* Day cards */}
          {week.days.map((d, di) => {
            const p = dp(wk, di); const rest = !d.exercises.length && d.title === "Full Rest";
            return (
              <div key={di} onClick={() => setDayI(di)} style={{ ...fd, transitionDelay: `${di * 30}ms`, background: c.cb, border: `1px solid ${c.bd}`, borderRadius: 14, padding: "14px 16px", marginBottom: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: anim ? 0 : (rest ? 0.4 : 1) }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.mt, letterSpacing: "0.1em" }}>{d.day.toUpperCase()}</span>
                    {d.exercises.some((ex) => ex.equip === "Dumbbell" || ex.equip === "Cable" || ex.equip === "Barbell") && <span style={{ fontSize: 8, fontWeight: 700, color: c.ac, background: c.sb, padding: "2px 6px", borderRadius: 99 }}>NEW EXERCISES</span>}
                    {p === 100 && <span style={{ background: c.abg, color: c.afg, fontSize: 8, fontWeight: 800, padding: "2px 7px", borderRadius: 99 }}>DONE</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: c.mt, marginTop: 1 }}>{d.focus}</div>
                  {!rest && p > 0 && p < 100 && <div style={{ marginTop: 6, height: 3, width: 80, background: c.bd, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${p}%`, background: c.ac, borderRadius: 99 }} /></div>}
                </div>
                <div style={{ color: c.mt, display: "flex", alignItems: "center" }}>
                  {d.exercises.length > 0 && <span style={{ fontSize: 11, marginRight: 4 }}>{d.exercises.length}</span>}
                  <ChR />
                </div>
              </div>
            );
          })}
        </>}

        {/* ── DAY DETAIL ── */}
        {page === "dashboard" && dayI !== null && (() => {
          const d = week.days[dayI]; const p = dp(wk, dayI); const hasEx = d.exercises.length > 0;
          const isRest = d.title === "Full Rest";
          const isWorkoutDay = hasEx && !isRest && d.title !== "Active Recovery";
          const mealTimeline = isWorkoutDay ? MEALS_BY_DAY.workout : MEALS_BY_DAY.rest;
          return (
            <div style={fd}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.mt, marginBottom: 12 }}>{d.focus}</div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 16, background: c.sb, borderRadius: 10, padding: 3 }}>
                {hasEx && <NavBtn label={`Workout (${d.exercises.length})`} active={tab === "workout"} onClick={() => setTab("workout")} />}
                <NavBtn label="Meals & Supps" active={tab === "meals"} onClick={() => setTab("meals")} />
                <NavBtn label="Timeline" active={tab === "timeline"} onClick={() => setTab("timeline")} />
              </div>

              {/* WORKOUT TAB */}
              {tab === "workout" && hasEx && <>
                {/* Start session */}
                {isWorkoutDay && !gymStarted && (
                  <button onClick={() => { setGymStarted(true); setElapsed(0); }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: c.abg, color: c.afg, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Play /> Start Gym Session
                  </button>
                )}
                {gymStarted && (
                  <button onClick={() => { setGymStarted(false); clearInterval(timerRef.current); }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: `1px solid ${c.bd}`, background: "transparent", color: "#FF4444", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
                    End Session — {fmtTime(elapsed)}
                  </button>
                )}

                {/* Progress */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: c.mt }}>{d.exercises.filter((_, i) => done[`${wk}-${dayI}-${i}`]).length}/{d.exercises.length}</span>
                    {p === 100 && <span style={{ fontSize: 11, fontWeight: 700, color: c.ac }}>Complete</span>}
                  </div>
                  <div style={{ height: 3, background: c.bd, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${p}%`, background: c.ac, borderRadius: 99, transition: "width 0.4s" }} /></div>
                </div>

                {/* Exercises */}
                {d.exercises.map((ex, ei) => {
                  const k = `${wk}-${dayI}-${ei}`; const dn = done[k];
                  return (
                    <div key={ei} style={{ background: dn ? c.sb : c.cb, border: `1px solid ${dn ? c.ac : c.bd}`, borderRadius: 14, padding: "16px", marginBottom: 10, opacity: dn ? 0.6 : 1, transition: "all 0.3s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, textDecoration: dn ? "line-through" : "none" }}>{ex.name}</span>
                            <span style={{ fontSize: 8, fontWeight: 700, color: c.ac, background: c.sb, padding: "2px 6px", borderRadius: 99 }}>{ex.equip}</span>
                          </div>
                          <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                            {[{ l: "Sets", v: ex.sets }, { l: "Reps", v: ex.reps }, { l: "Weight", v: ex.weight }, { l: "Rest", v: ex.rest }].map((it, i) => (
                              <div key={i}><div style={{ fontSize: 9, fontWeight: 700, color: c.mt, letterSpacing: "0.1em" }}>{it.l}</div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 1 }}>{it.v}</div></div>
                            ))}
                          </div>
                          {ex.notes && <div style={{ marginTop: 10, fontSize: 11, color: c.mt, padding: "6px 10px", background: c.mb, borderRadius: 7, lineHeight: 1.5, fontStyle: "italic" }}>{ex.notes}</div>}
                        </div>
                        <button onClick={() => tog(wk, dayI, ei)} style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, border: dn ? "none" : `2px solid ${c.bd}`, background: dn ? c.abg : "transparent", color: dn ? c.afg : c.mt, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 10 }}>{dn && <Check />}</button>
                      </div>
                    </div>
                  );
                })}
              </>}

              {/* MEALS TAB */}
              {tab === "meals" && (
                <div>
                  {mealTimeline.filter(m => m.key !== "gym").map((m, i) => (
                    <div key={i} style={{ background: m.suppNote ? c.sb : c.cb, border: `1px solid ${m.suppNote ? c.ac + "33" : c.bd}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {m.suppNote ? <Pill /> : <Clock />}
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.label}</span>
                        </div>
                        <span style={{ fontSize: 10, color: c.mt, fontWeight: 600 }}>{m.time}</span>
                      </div>
                      {m.suppNote && <div style={{ fontSize: 12, color: c.fg, lineHeight: 1.5, marginTop: 4 }}>{m.suppNote}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* TIMELINE TAB */}
              {tab === "timeline" && (
                <div style={{ position: "relative", paddingLeft: 24 }}>
                  <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: c.bd }} />
                  {(isWorkoutDay ? MEALS_BY_DAY.workout : MEALS_BY_DAY.rest).map((m, i) => (
                    <div key={i} style={{ position: "relative", marginBottom: 20, paddingLeft: 20 }}>
                      <div style={{ position: "absolute", left: -20, top: 4, width: 12, height: 12, borderRadius: 99, background: m.key === "gym" ? c.ac : c.cb, border: `2px solid ${m.key === "gym" ? c.ac : c.bd}` }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: c.mt, letterSpacing: "0.08em" }}>{m.time}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: m.key === "gym" ? c.ac : c.fg }}>{m.label}</div>
                      {m.suppNote && <div style={{ fontSize: 11, color: c.mt, marginTop: 2 }}>{m.suppNote}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Nav */}
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                {dayI > 0 && <button onClick={() => setDayI(dayI - 1)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${c.bd}`, background: "transparent", color: c.fg, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Previous</button>}
                {dayI < week.days.length - 1 && <button onClick={() => setDayI(dayI + 1)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: c.abg, color: c.afg, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Next Day →</button>}
              </div>
            </div>
          );
        })()}

        {/* ── SUPPLEMENTS PAGE ── */}
        {page === "supps" && (
          <div style={fd}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Recommended Products</div>
            {SUPPLEMENTS.map((s, i) => (
              <div key={i} style={{ background: c.cb, border: `1px solid ${c.bd}`, borderRadius: 14, padding: "16px", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.ac, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{s.brands}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: c.sb, color: c.ac, padding: "3px 10px", borderRadius: 99 }}>{s.dose}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: c.sb, color: c.ac, padding: "3px 10px", borderRadius: 99 }}>{s.when}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: c.mb, color: c.mt, padding: "3px 10px", borderRadius: 99 }}>{s.price}</span>
                </div>
                <div style={{ fontSize: 12, color: c.mt, lineHeight: 1.5 }}>{s.why}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: c.bg, borderTop: `1px solid ${c.bd}`, padding: "8px 16px 12px", display: "flex", gap: 4, zIndex: 100 }}>
        <button onClick={() => { setPage("dashboard"); setDayI(null); }} style={{ flex: 1, padding: "10px 0", background: page === "dashboard" ? c.sb : "transparent", border: `1px solid ${page === "dashboard" ? c.ac + "44" : "transparent"}`, borderRadius: 12, color: page === "dashboard" ? c.ac : c.mt, fontWeight: 700, fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <Dumbbell />Workout
        </button>
        <button onClick={() => setPage("supps")} style={{ flex: 1, padding: "10px 0", background: page === "supps" ? c.sb : "transparent", border: `1px solid ${page === "supps" ? c.ac + "44" : "transparent"}`, borderRadius: 12, color: page === "supps" ? c.ac : c.mt, fontWeight: 700, fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <Pill />Supplements
        </button>
      </div>
    </div>
  );
}
