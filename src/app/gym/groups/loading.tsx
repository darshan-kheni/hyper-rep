import { Loader2 } from "lucide-react";

export default function GroupsLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={24} className="animate-spin text-accent" />
    </div>
  );
}
