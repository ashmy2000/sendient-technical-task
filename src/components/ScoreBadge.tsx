import { cn } from "@/lib/utils/cn";

export function ScoreBadge({ score }: { readonly score: number }) {
  let cls = "bg-error/10 text-error";
  if (score >= 70) cls = "bg-success/10 text-success";
  else if (score >= 50) cls = "bg-warning/10 text-warning";

  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-xs font-semibold",
        cls,
      )}
    >
      {score.toFixed(0)}
    </span>
  );
}
