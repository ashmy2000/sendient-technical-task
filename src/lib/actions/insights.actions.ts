"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { progressRecords, students, topics } from "@/lib/db/schema";
import type { CohortInsightData } from "@/lib/insights";

export async function getCohortInsightData(): Promise<CohortInsightData> {
  const [studentRows, topicRows, recordRows] = await Promise.all([
    db
      .select({
        id: students.id,
        name: students.name,
        yearGroup: students.yearGroup,
      })
      .from(students)
      .where(isNull(students.deletedAt))
      .all(),
    db
      .select({
        id: topics.id,
        name: topics.name,
        subject: topics.subject,
      })
      .from(topics)
      .where(isNull(topics.deletedAt))
      .all(),
    db
      .select({
        studentId: progressRecords.studentId,
        topicId: progressRecords.topicId,
        score: progressRecords.score,
        recordedAt: progressRecords.recordedAt,
      })
      .from(progressRecords)
      .innerJoin(students, eq(progressRecords.studentId, students.id))
      .innerJoin(topics, eq(progressRecords.topicId, topics.id))
      .where(
        and(
          isNull(progressRecords.deletedAt),
          isNull(students.deletedAt),
          isNull(topics.deletedAt),
        ),
      )
      .all(),
  ]);

  return {
    students: studentRows,
    topics: topicRows,
    records: recordRows,
  };
}
