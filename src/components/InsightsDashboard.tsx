"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import {
  buildCohortInsights,
  buildStudentRecordInsight,
  buildStudentTopicInsights,
  type CohortInsightData,
  type ScoreBandKey,
  type TermKey,
  type TermSubjectInsight,
} from "@/lib/insights";
import { cn } from "@/lib/utils/cn";

interface InsightsDashboardProps {
  readonly data: CohortInsightData;
}

const bandStyles: Record<ScoreBandKey, string> = {
  below50: "bg-error/10 border-error/30",
  "50to59": "bg-warning/10 border-warning/30",
  "60to69": "bg-primary/10 border-primary/30",
  "70plus": "bg-success/10 border-success/30",
};

function formatAverage(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function averageTextClass(value: number | null): string {
  if (value == null) return "text-muted-foreground";
  if (value >= 70) return "text-success";
  if (value >= 50) return "text-warning";
  return "text-error";
}

const TERM_ORDER: ReadonlyArray<TermKey> = ["Autumn", "Spring", "Summer"];

function TermBarChart({
  subjectTerms,
  isGrouped,
}: {
  readonly subjectTerms: ReadonlyArray<TermSubjectInsight>;
  readonly isGrouped: boolean;
}) {
  const subjects = Array.from(
    new Set(subjectTerms.map((st) => st.subject)),
  ).sort((a, b) => a.localeCompare(b));

  function avgFor(term: TermKey, subj: string): number | null {
    return (
      subjectTerms.find((st) => st.term === term && st.subject === subj)
        ?.average ?? null
    );
  }

  if (!isGrouped) {
    const subj = subjects[0] ?? "";
    return (
      <div className="mt-4">
        <div className="flex h-24 gap-3">
          {TERM_ORDER.map((termKey) => {
            const pct = avgFor(termKey, subj);
            return (
              <div key={termKey} className="flex flex-1 flex-col items-center">
                <span className="mb-1 text-[11px] font-medium leading-none">
                  {pct != null ? `${pct.toFixed(1)}%` : "—"}
                </span>
                <div className="relative w-full flex-1 overflow-hidden rounded-sm bg-muted">
                  {pct != null && (
                    <div
                      className="absolute bottom-0 w-full bg-primary"
                      style={{ height: `${pct}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex gap-3">
          {TERM_ORDER.map((termKey) => (
            <span
              key={termKey}
              className="flex-1 text-center text-[11px] text-muted-foreground"
            >
              {termKey}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-6">
        {TERM_ORDER.map((termKey) => (
          <div key={termKey} className="flex flex-col items-center gap-1">
            <div className="flex h-20 gap-1.5">
              {subjects.map((subj) => {
                const pct = avgFor(termKey, subj);
                return (
                  <div
                    key={subj}
                    className="flex w-8 flex-col items-center"
                    title={`${subj}: ${pct != null ? `${pct.toFixed(1)}%` : "—"}`}
                  >
                    <span className="text-[9px] leading-none font-medium">
                      {pct != null ? String(Math.round(pct)) : "—"}
                    </span>
                    <div className="relative mt-0.5 w-full flex-1 rounded-sm bg-muted">
                      {pct != null && (
                        <div
                          className="absolute bottom-0 w-full rounded-b-sm bg-primary"
                          style={{ height: `${pct}%` }}
                        />
                      )}
                    </div>
                    <span className="mt-0.5 text-[9px] leading-none text-muted-foreground">
                      {subj.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] text-muted-foreground">{termKey}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex min-w-max gap-4 border-t border-border pt-2 text-[10px] text-muted-foreground">
        {subjects.map((subj, i) => (
          <span key={subj}>
            {subj.slice(0, 3)}
            {" = "}
            {subj}
            {i < subjects.length - 1 ? " ·" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function InsightsDashboard({ data }: InsightsDashboardProps) {
  const yearGroups = useMemo(
    () =>
      Array.from(new Set(data.students.map((student) => student.yearGroup))).sort(
        (a, b) => a - b,
      ),
    [data.students],
  );
  const subjects = useMemo(
    () =>
      Array.from(new Set(data.topics.map((topic) => topic.subject))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [data.topics],
  );
  const [yearGroup, setYearGroup] = useState<number | null>(
    yearGroups.at(-1) ?? null,
  );
  const [subject, setSubject] = useState<string | null>(subjects[0] ?? null);
  const [openBand, setOpenBand] = useState<ScoreBandKey | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(
    null,
  );
  const [studentRecordOpen, setStudentRecordOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    () => {
      const highestYearGroup = yearGroups.at(-1);
      return (
        data.students
          .filter((student) => student.yearGroup === highestYearGroup)
          .sort((a, b) => a.name.localeCompare(b.name))[0]?.id ?? null
      );
    },
  );
  const insights = useMemo(
    () => buildCohortInsights(data.students, data.topics, data.records, {
      yearGroup,
      subject,
    }),
    [data, subject, yearGroup],
  );
  const cohortStudents = useMemo(
    () =>
      data.students
        .filter((student) => student.yearGroup === yearGroup)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.students, yearGroup],
  );
  const activeStudentId = cohortStudents.some(
    (student) => student.id === selectedStudentId,
  )
    ? selectedStudentId
    : (cohortStudents[0]?.id ?? null);
  const studentRecord = useMemo(
    () =>
      activeStudentId == null
        ? null
        : buildStudentRecordInsight(
            activeStudentId,
            data.topics,
            data.records,
          ),
    [activeStudentId, data.records, data.topics],
  );
  const selectedBand =
    insights.bands.find((band) => band.key === openBand) ?? null;

  if (data.students.length === 0) {
    return (
      <Card>
        <CardTitle>No students to analyse</CardTitle>
        <CardSubtitle className="mt-1">
          Add students before reviewing cohort progress.
        </CardSubtitle>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-muted p-4">
        <h2 className="font-semibold">
          Summary of average scores across cohort and subject
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Cohort
            <select
              value={yearGroup ?? yearGroups.at(-1) ?? ""}
              onChange={(event) => {
                const nextYearGroup = Number(event.target.value);
                const nextStudent = data.students
                  .filter((student) => student.yearGroup === nextYearGroup)
                  .sort((a, b) => a.name.localeCompare(b.name))[0];
                setYearGroup(nextYearGroup);
                setSelectedStudentId(nextStudent?.id ?? null);
                setOpenBand(null);
                setExpandedStudentId(null);
              }}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 font-normal"
            >
              {yearGroups.map((value) => (
                <option key={value} value={value}>
                  Year {value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Subject
            <select
              value={subject ?? ""}
              onChange={(event) => {
                setSubject(event.target.value || null);
                setOpenBand(null);
                setExpandedStudentId(null);
              }}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 font-normal"
            >
              <option value="">All subjects</option>
              {subjects.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {insights.summary.assessedStudents === 0
            ? "No progress recorded yet"
            : `${insights.summary.assessedStudents} assessed students · ${insights.summary.totalRecords} records · ${formatAverage(insights.summary.cohortAverage)} average`}
        </p>

        <h2 id="score-bands" className="sr-only">
          Score bands
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {insights.bands.map((band) => (
            <button
              key={band.key}
              type="button"
              aria-expanded={openBand === band.key}
              onClick={() =>
                setOpenBand((current) =>
                  current === band.key ? null : band.key,
                )
              }
              className={cn(
                "rounded-lg border p-4 text-left transition-opacity hover:opacity-80",
                bandStyles[band.key],
              )}
            >
              <p className="text-sm font-medium">{band.label}</p>
              <p className="mt-2 text-3xl font-semibold">
                {insights.summary.assessedStudents === 0
                  ? "—"
                  : `${band.percentage.toFixed(1)}%`}
              </p>
              <p className="text-sm text-muted-foreground">
                {band.count} {band.count === 1 ? "student" : "students"}
              </p>
            </button>
          ))}
        </div>

        {selectedBand ? (
          <div className="mt-4 rounded-lg border border-border bg-background p-4">
            <div className="flex items-baseline justify-between gap-4">
              <CardTitle>{selectedBand.label}</CardTitle>
              <CardSubtitle>
                {selectedBand.count}{" "}
                {selectedBand.count === 1 ? "student" : "students"}
              </CardSubtitle>
            </div>
            {selectedBand.students.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No students in this band for the selected cohort and subject.
              </p>
            ) : (
              <div className="mt-3 max-h-64 overflow-y-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-1 font-medium">Student</th>
                      <th className="py-1 text-right font-medium">
                        Selected subject average
                      </th>
                      <th className="py-1 text-right font-medium">
                        Overall average
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBand.students.map((student) => {
                      const isExpanded = expandedStudentId === student.id;
                      const studentTopics = isExpanded
                        ? buildStudentTopicInsights(
                            student.id,
                            subject,
                            data.topics,
                            data.records,
                          )
                        : [];

                      return (
                        <Fragment key={student.id}>
                          <tr className="border-t border-border">
                            <td className="py-2">
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                onClick={() =>
                                  setExpandedStudentId((current) =>
                                    current === student.id ? null : student.id,
                                  )
                                }
                                className="font-medium text-primary hover:underline"
                              >
                                {student.name}
                              </button>
                            </td>
                            <td className="py-2 text-right">
                              {formatAverage(student.selectedAverage)}
                            </td>
                            <td className="py-2 text-right text-muted-foreground">
                              {formatAverage(student.overallAverage)}
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="bg-muted">
                              <td colSpan={3} className="px-4 py-3">
                                {studentTopics.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    No topic scores available for this student
                                    and subject.
                                  </p>
                                ) : (
                                  <ul className="space-y-2">
                                    {studentTopics.map((topic) => (
                                      <li
                                        key={topic.id}
                                        className="flex justify-between gap-4 text-sm"
                                      >
                                        <span>{topic.name}</span>
                                        <span className="font-medium">
                                          {formatAverage(topic.average)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4">
            <CardTitle>Cohort progress by term</CardTitle>
            <CardSubtitle>
              {subject == null
                ? "All subjects · Autumn, Spring, and Summer"
                : "Autumn, Spring, and Summer for the selected subject"}
            </CardSubtitle>
            <TermBarChart
              subjectTerms={insights.termSubjectPerformance}
              isGrouped={subject == null}
            />
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <CardTitle>Topic strengths and gaps</CardTitle>
            <CardSubtitle>Weakest to strongest topic averages</CardSubtitle>
            {insights.topics.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Not enough topic data for this cohort and subject.
              </p>
            ) : (
              <div className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                {insights.topics.map((topic) => (
                  <div key={topic.id}>
                    <div className="mb-1 flex justify-between gap-4 text-sm">
                      <span className="font-medium">
                        {subject == null && (
                          <span className="font-normal text-muted-foreground">
                            {topic.subject} ·{" "}
                          </span>
                        )}
                        {topic.name}
                      </span>
                      <span className="shrink-0">
                        {formatAverage(topic.average)} · {topic.studentCount}{" "}
                        {topic.studentCount === 1 ? "student" : "students"}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${topic.average}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-muted p-4">
        <button
          type="button"
          aria-expanded={studentRecordOpen}
          onClick={() => setStudentRecordOpen((open) => !open)}
          className="w-full text-left"
        >
          <span className="font-semibold">Individual student record</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Open to review individual student&apos;s strengths and focus areas.
          </span>
        </button>

        {studentRecordOpen ? (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <label className="block text-sm font-medium">
              Student
              <select
                value={activeStudentId ?? ""}
                onChange={(event) =>
                  setSelectedStudentId(Number(event.target.value))
                }
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 font-normal"
              >
                {cohortStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </label>

            {studentRecord ? (
              <>
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">
                    Average across all subjects
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-3xl font-semibold",
                      averageTextClass(studentRecord.overallAverage),
                    )}
                  >
                    {formatAverage(studentRecord.overallAverage)}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {studentRecord.subjects.map((item) => (
                    <div
                      key={item.subject}
                      className="rounded-lg border border-border bg-background p-3"
                    >
                      <p className="text-sm font-medium">{item.subject}</p>
                      <p
                        className={cn(
                          "mt-1 text-2xl font-semibold",
                          averageTextClass(item.average),
                        )}
                      >
                        {formatAverage(item.average)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <CardTitle>May need focus</CardTitle>
                    {studentRecord.focusAreas.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No topic averages below 50%.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-sm">
                        {studentRecord.focusAreas.map((topic) => (
                          <li
                            key={topic.key}
                            className="flex justify-between gap-4"
                          >
                            <span>{topic.label}</span>
                            <span>
                              {formatAverage(topic.average)} (
                              {topic.recordCount}{" "}
                              {topic.recordCount === 1 ? "record" : "records"}{" "}
                              below 50%)
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4">
                    <CardTitle>Strengths</CardTitle>
                    {studentRecord.strengths.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No topic scores recorded yet.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-sm">
                        {studentRecord.strengths.map((topic) => (
                          <li
                            key={topic.key}
                            className="flex justify-between gap-4"
                          >
                            <span>{topic.label}</span>
                            <span>
                              {formatAverage(topic.average)} ({topic.recordCount}{" "}
                              {topic.recordCount === 1 ? "record" : "records"})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <Link
                  href={`/students/${studentRecord.studentId}`}
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  View full student record
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No students available for this cohort.
              </p>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
