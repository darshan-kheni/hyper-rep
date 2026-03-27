import { SUPPLEMENTS } from "@/lib/gym/meal-data";
import { Card } from "@/components/ui/Card";

export default function SupplementsPage() {
  return (
    <div>
      <h2 className="mb-1 text-lg font-bold">Supplement Guide</h2>
      <p className="mb-4 text-xs text-text-muted">Recommended products for vegetarian bulking</p>

      <div className="flex flex-col gap-3">
        {SUPPLEMENTS.map((s, i) => (
          <Card key={i}>
            <div className="text-[15px] font-bold text-accent mb-1">
              {s.name}
            </div>
            <div className="text-[13px] font-semibold mb-3">
              {s.brands}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="rounded-full bg-accent-subtle px-2.5 py-1 text-[10px] font-bold text-accent">
                {s.dose}
              </span>
              <span className="rounded-full bg-accent-subtle px-2.5 py-1 text-[10px] font-bold text-accent">
                {s.when}
              </span>
              <span className="rounded-full bg-bg-elevated px-2.5 py-1 text-[10px] font-bold text-text-muted">
                {s.price}
              </span>
            </div>
            <div className="text-xs text-text-muted leading-relaxed">
              {s.why}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
