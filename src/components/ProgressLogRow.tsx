"use client";

import { Fragment, useState } from "react";
import { ScoreBadge } from "@/components/ScoreBadge";

interface ProgressLogRowProps {
  readonly id: number;
  readonly date: string;
  readonly topicName: string;
  readonly topicSubject: string;
  readonly score: number;
  readonly notes: string | null;
}

export function ProgressLogRow({
  id,
  date,
  topicName,
  topicSubject,
  score,
  notes,
}: ProgressLogRowProps) {
  const [showNotes, setShowNotes] = useState(false);
  const hasNotes = notes != null && notes.trim() !== "";
  const notesId = `progress-notes-${id}`;

  return (
    <Fragment>
      <tr className="border-t border-border">
        <td className="py-2 text-muted-foreground">{date}</td>
        <td className="py-2">{topicName}</td>
        <td className="py-2 text-muted-foreground">{topicSubject}</td>
        <td className="py-2">
          <ScoreBadge score={score} />
        </td>
        <td className="py-2 text-center">
          {hasNotes ? (
            <button
              type="button"
              aria-expanded={showNotes}
              aria-controls={notesId}
              onClick={() => setShowNotes((visible) => !visible)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {showNotes ? "Close notes" : "Open notes"}
            </button>
          ) : null}
        </td>
      </tr>
      {hasNotes && showNotes ? (
        <tr id={notesId} className="bg-muted">
          <td
            colSpan={5}
            className="max-w-0 whitespace-pre-wrap break-words px-3 py-2 text-sm text-primary"
          >
            <span className="font-medium">Notes:</span> {notes}
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}
