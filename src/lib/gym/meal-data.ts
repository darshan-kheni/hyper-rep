export type MealSlot = {
  key: string;
  label: string;
  time: string;
  suppNote: string | null;
};

export const MEALS_WORKOUT_DAY: MealSlot[] = [
  { key: "breakfast", label: "Breakfast", time: "8:00 AM", suppNote: "5g Creatine + 1 Multivitamin" },
  { key: "lunch", label: "Lunch", time: "1:00 PM", suppNote: null },
  { key: "gainer", label: "Gainer Shake", time: "3:30 PM", suppNote: "Mass Gainer (1 serving + milk) — 2 hrs before gym" },
  { key: "preWorkout", label: "Pre-Workout", time: "5:00 PM", suppNote: "Light — banana + black coffee" },
  { key: "gym", label: "GYM", time: "5:30–6:30 PM", suppNote: null },
  { key: "postWorkout", label: "Post-Workout", time: "~6:45 PM", suppNote: "Whey (1 scoop + milk) — within 30 min" },
  { key: "dinner", label: "Dinner", time: "8:30 PM", suppNote: null },
];

export const MEALS_REST_DAY: MealSlot[] = [
  { key: "breakfast", label: "Breakfast", time: "9:00 AM", suppNote: "5g Creatine + 1 Multivitamin" },
  { key: "lunch", label: "Lunch", time: "1:00 PM", suppNote: null },
  { key: "snack", label: "Whey Snack", time: "4:00 PM", suppNote: "Whey (1 scoop + milk) — rest day timing" },
  { key: "dinner", label: "Dinner", time: "8:30 PM", suppNote: null },
];

export type Supplement = {
  name: string;
  brands: string;
  dose: string;
  when: string;
  why: string;
  price: string;
};

export const SUPPLEMENTS: Supplement[] = [
  {
    name: "Creatine Monohydrate",
    brands: "MuscleBlaze Creatine / ON Micronized",
    dose: "5g/day",
    when: "With breakfast, every day",
    why: "Most researched supplement. Only monohydrate is proven. Skip HCL, ethyl ester.",
    price: "₹500–800 for 250g",
  },
  {
    name: "Whey Protein",
    brands: "MuscleBlaze Biozyme / ON Gold Standard",
    dose: "1 scoop (~30g protein)",
    when: "Post-workout / between meals on rest days",
    why: "Fast-absorbing. Look for >24g protein per scoop, <5g sugar.",
    price: "₹2000–3500 for 1kg",
  },
  {
    name: "Mass Gainer",
    brands: "MuscleBlaze Super Gainer XXL / ON Serious Mass",
    dose: "1 serving (~800-1000 cal)",
    when: "3:30 PM (2 hrs before gym)",
    why: "Calorie surplus made easy. Choose <40g sugar. Mix with milk.",
    price: "₹1500–3000 for 1kg",
  },
  {
    name: "Multivitamin",
    brands: "MuscleBlaze MB-Vite / HealthKart HK Vitals",
    dose: "1 tablet/day",
    when: "With breakfast",
    why: "Vegetarians lack B12, D3, Iron, Zinc. Cover the gaps.",
    price: "₹300–600 for 60 tabs",
  },
  {
    name: "Omega-3 (Optional)",
    brands: "HealthKart Fish Oil / Flaxseed Oil (veg)",
    dose: "1000mg",
    when: "With any meal",
    why: "Joint health, inflammation reduction. Flaxseed if strict veg.",
    price: "₹400–700 for 60 caps",
  },
];
