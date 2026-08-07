import { labelSpaceInstances } from "@/lib/spaces";
import { SPACE_QUESTIONS } from "@/lib/spaceQuestions";

export type SpaceEntry = {
  id: string;
  spaceKey: string;
  notes: string | null;
  answers: { questionKey: string; value: string }[];
};

// The client's per-space sub-selections from the Features wizard (e.g.
// "how many chairs in the meeting room") - shared between the designer and
// admin dashboards so a designer can see exactly what was asked for before
// claiming or delivering a request.
export default function SpaceRequirements({ spaceEntries }: { spaceEntries: SpaceEntry[] }) {
  const instances = labelSpaceInstances(spaceEntries);
  if (instances.length === 0) return <div className="empty">No spaces recorded for this request.</div>;

  return (
    <>
      {instances.map((instance) => (
        <div key={instance.id} className="designer-space-answers">
          <div className="designer-space-answers-title">{instance.label}</div>
          {(SPACE_QUESTIONS[instance.spaceKey] ?? []).map((q) => {
            const answer = instance.answers.find((a) => a.questionKey === q.key);
            if (!answer) return null;
            const value = q.type === "boolean" ? (answer.value === "true" ? "Yes" : "No") : answer.value;
            return (
              <div key={q.key} className="designer-space-answer-row">
                <span>{q.label}</span>
                <b>{value}</b>
              </div>
            );
          })}
          {instance.notes && <p className="designer-space-notes">&ldquo;{instance.notes}&rdquo;</p>}
        </div>
      ))}
    </>
  );
}
