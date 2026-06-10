import { InsightsDashboard } from "@/components/InsightsDashboard";
import { getCohortInsightData } from "@/lib/actions/insights.actions";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const data = await getCohortInsightData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cohort insights</h1>
        <p className="mt-1 text-muted-foreground">
          Analyse class performance across year groups, subjects, and topics.
        </p>
      </div>
      <InsightsDashboard data={data} />
    </div>
  );
}
