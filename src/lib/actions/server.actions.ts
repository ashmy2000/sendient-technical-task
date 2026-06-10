"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { progressRecords, students, topics } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export async function getStudents() {
  return db.select().from(students).orderBy(students.name).all();
}

export async function getStudent(id: number) {
  const row = db.select().from(students).where(eq(students.id, id)).get();
  return row ?? null;
}

export async function createStudent(input: { name: string; yearGroup: number }) {
  const [row] = db
    .insert(students)
    .values({ name: input.name, yearGroup: input.yearGroup })
    .returning()
    .all();
  revalidatePath("/students");
  return row;
}

export async function deleteStudent(id: number) {
  db.delete(students).where(eq(students.id, id)).run();
  revalidatePath("/students");
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export async function getTopics() {
  return db.select().from(topics).orderBy(topics.subject, topics.name).all();
}

export async function createTopic(input: { name: string; subject: string }) {
  const [row] = db.insert(topics).values(input).returning().all();
  revalidatePath("/topics");
  return row;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

const recordProgressSchema = z.object({
  studentId: z.number(),
  topicId: z.number(),
  score: z.number().int().min(0).max(100),
  notes: z.string().nullable().optional(),
});

export async function recordProgress(input: unknown) {
  const result = recordProgressSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false as const,
      error: "Score must be a whole number between 0 and 100.",
    };
  }

  const parsed = result.data;
  const [row] = db
    .insert(progressRecords)
    .values({
      studentId: parsed.studentId,
      topicId: parsed.topicId,
      score: parsed.score,
      notes: parsed.notes ?? null,
    })
    .returning()
    .all();
  revalidatePath(`/students/${parsed.studentId}`);
  return { success: true as const, record: row };
}

export async function getProgressForStudent(studentId: number) {
  return db
    .select({
      id: progressRecords.id,
      score: progressRecords.score,
      notes: progressRecords.notes,
      recordedAt: progressRecords.recordedAt,
      topicId: progressRecords.topicId,
      topicName: topics.name,
      topicSubject: topics.subject,
    })
    .from(progressRecords)
    .innerJoin(topics, eq(progressRecords.topicId, topics.id))
    .where(eq(progressRecords.studentId, studentId))
    .orderBy(desc(progressRecords.recordedAt))
    .all();
}

export async function getAverageForStudent(
  studentId: number,
): Promise<number | null> {
  const rows = db
    .select({ score: progressRecords.score })
    .from(progressRecords)
    .where(eq(progressRecords.studentId, studentId))
    .all();
  if (rows.length === 0) return null;

  const total = rows.reduce((sum, r) => sum + r.score, 0);
  return total / rows.length;
}

// ---------------------------------------------------------------------------
// Internal admin helpers
// ---------------------------------------------------------------------------

// Used by the seed/reset flow. Wipes the table.
export async function _unsafeDeleteAllProgress(): Promise<void> {
  db.delete(progressRecords).run();
}
