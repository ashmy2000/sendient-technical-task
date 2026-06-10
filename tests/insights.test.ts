import { describe, expect, it } from "vitest";
import {
  buildCohortInsights,
  buildStudentRecordInsight,
  buildStudentTopicInsights,
  type InsightRecordInput,
  type InsightStudent,
  type InsightTopic,
} from "@/lib/insights";

const students: InsightStudent[] = [
  { id: 1, name: "Ada", yearGroup: 7 },
  { id: 2, name: "Grace", yearGroup: 7 },
  { id: 3, name: "Katherine", yearGroup: 8 },
  { id: 4, name: "Margaret", yearGroup: 8 },
];

const topics: InsightTopic[] = [
  { id: 1, name: "Algebra", subject: "Maths" },
  { id: 2, name: "Geometry", subject: "Maths" },
  { id: 3, name: "Forces", subject: "Science" },
];

describe("buildCohortInsights", () => {
  it("returns null rather than NaN or zero when there is no progress", () => {
    const insights = buildCohortInsights(students, topics, []);

    expect(insights.summary.cohortAverage).toBeNull();
    expect(insights.summary.cohortAverage).not.toBe(Number.NaN);
    expect(insights.summary.assessedStudents).toBe(0);
    expect(insights.bands.every((band) => band.percentage === 0)).toBe(true);
  });

  it("preserves a genuine zero average", () => {
    const insights = buildCohortInsights(students, topics, [
      { studentId: 1, topicId: 1, score: 0 },
    ]);

    expect(insights.summary.cohortAverage).toBe(0);
    expect(insights.bands.find((band) => band.key === "below50")).toMatchObject({
      count: 1,
      percentage: 100,
    });
  });

  it("uses the four requested score-band boundaries", () => {
    const insights = buildCohortInsights(students, topics, [
      { studentId: 1, topicId: 1, score: 49 },
      { studentId: 2, topicId: 1, score: 50 },
      { studentId: 3, topicId: 1, score: 60 },
      { studentId: 4, topicId: 1, score: 70 },
    ]);

    expect(
      Object.fromEntries(
        insights.bands.map((band) => [band.key, band.count]),
      ),
    ).toEqual({
      below50: 1,
      "50to59": 1,
      "60to69": 1,
      "70plus": 1,
    });
    expect(insights.bands.every((band) => band.percentage === 25)).toBe(true);
  });

  it("filters assessed students and records by year group", () => {
    const insights = buildCohortInsights(
      students,
      topics,
      [
        { studentId: 1, topicId: 1, score: 40 },
        { studentId: 2, topicId: 1, score: 60 },
        { studentId: 3, topicId: 1, score: 100 },
      ],
      { yearGroup: 7, subject: null },
    );

    expect(insights.summary).toEqual({
      totalStudents: 2,
      assessedStudents: 2,
      totalRecords: 2,
      cohortAverage: 50,
    });
  });

  it("uses selected-subject averages while retaining overall averages", () => {
    const insights = buildCohortInsights(
      students,
      topics,
      [
        { studentId: 1, topicId: 1, score: 40 },
        { studentId: 1, topicId: 3, score: 80 },
      ],
      { yearGroup: null, subject: "Maths" },
    );
    const student = insights.bands
      .flatMap((band) => band.students)
      .find((item) => item.id === 1);

    expect(student).toMatchObject({
      selectedAverage: 40,
      overallAverage: 60,
      recordCount: 1,
    });
  });

  it("weights cohort averages equally by student", () => {
    const records: InsightRecordInput[] = [
      { studentId: 1, topicId: 1, score: 0 },
      { studentId: 1, topicId: 1, score: 0 },
      { studentId: 1, topicId: 1, score: 0 },
      { studentId: 2, topicId: 1, score: 100 },
      { studentId: 3, topicId: 1, score: 50 },
    ];
    const insights = buildCohortInsights(students, topics, records);

    expect(insights.summary.cohortAverage).toBe(50);
  });

  it("weights topic averages equally and excludes small samples", () => {
    const insights = buildCohortInsights(students, topics, [
      { studentId: 1, topicId: 1, score: 0 },
      { studentId: 1, topicId: 1, score: 0 },
      { studentId: 2, topicId: 1, score: 100 },
      { studentId: 3, topicId: 1, score: 50 },
      { studentId: 1, topicId: 3, score: 100 },
      { studentId: 2, topicId: 3, score: 100 },
    ]);

    expect(insights.topics).toEqual([
      {
        id: 1,
        name: "Algebra",
        subject: "Maths",
        average: 50,
        studentCount: 3,
        recordCount: 4,
      },
    ]);
  });

  it("applies subject filters to cohort and topic summaries", () => {
    const insights = buildCohortInsights(
      students,
      topics,
      [
        { studentId: 1, topicId: 1, score: 60 },
        { studentId: 2, topicId: 1, score: 60 },
        { studentId: 3, topicId: 1, score: 60 },
        { studentId: 1, topicId: 3, score: 90 },
        { studentId: 2, topicId: 3, score: 90 },
        { studentId: 3, topicId: 3, score: 90 },
      ],
      { yearGroup: null, subject: "Science" },
    );

    expect(insights.topics.map((topic) => topic.name)).toEqual(["Forces"]);
    expect(insights.summary.cohortAverage).toBe(90);
  });

  it("groups termSubjectPerformance by UK term and subject", () => {
    const insights = buildCohortInsights(
      students,
      topics,
      [
        {
          studentId: 1,
          topicId: 1,
          score: 80,
          recordedAt: new Date(Date.UTC(2024, 8, 10)),
        },
        {
          studentId: 2,
          topicId: 3,
          score: 60,
          recordedAt: new Date(Date.UTC(2025, 1, 5)),
        },
        {
          studentId: 1,
          topicId: 1,
          score: 70,
          recordedAt: new Date(Date.UTC(2025, 5, 1)),
        },
      ],
    );

    const autumn = insights.termSubjectPerformance.find(
      (t) => t.term === "Autumn" && t.subject === "Maths",
    );
    const spring = insights.termSubjectPerformance.find(
      (t) => t.term === "Spring" && t.subject === "Science",
    );
    const summer = insights.termSubjectPerformance.find(
      (t) => t.term === "Summer" && t.subject === "Maths",
    );

    expect(autumn?.average).toBe(80);
    expect(spring?.average).toBe(60);
    expect(summer?.average).toBe(70);
  });

  it("uses only the latest academic year for term performance", () => {
    const insights = buildCohortInsights(
      students,
      topics,
      [
        {
          studentId: 1,
          topicId: 1,
          score: 20,
          recordedAt: new Date(Date.UTC(2023, 8, 10)),
        },
        {
          studentId: 1,
          topicId: 1,
          score: 80,
          recordedAt: new Date(Date.UTC(2024, 8, 10)),
        },
        {
          studentId: 1,
          topicId: 1,
          score: 60,
          recordedAt: new Date(Date.UTC(2025, 1, 5)),
        },
      ],
      { yearGroup: 7, subject: "Maths" },
    );

    const autumn = insights.termSubjectPerformance.find(
      (item) => item.term === "Autumn" && item.subject === "Maths",
    );
    const spring = insights.termSubjectPerformance.find(
      (item) => item.term === "Spring" && item.subject === "Maths",
    );

    expect(autumn).toMatchObject({ average: 80, recordCount: 1 });
    expect(spring).toMatchObject({ average: 60, recordCount: 1 });
  });

  it("preserves a genuine zero term average and uses null for no records", () => {
    const insights = buildCohortInsights(
      students,
      topics,
      [
        {
          studentId: 1,
          topicId: 1,
          score: 0,
          recordedAt: new Date(Date.UTC(2024, 8, 10)),
        },
      ],
    );

    const autumn = insights.termSubjectPerformance.find(
      (t) => t.term === "Autumn" && t.subject === "Maths",
    );
    const spring = insights.termSubjectPerformance.find(
      (t) => t.term === "Spring" && t.subject === "Maths",
    );

    expect(autumn?.average).toBe(0);
    expect(spring?.average).toBeNull();
    expect(spring?.average).not.toBe(0);
  });

  it("restricts termSubjectPerformance to the selected subject when a subject filter is active", () => {
    const insights = buildCohortInsights(
      students,
      topics,
      [
        {
          studentId: 1,
          topicId: 1,
          score: 70,
          recordedAt: new Date(Date.UTC(2024, 8, 1)),
        },
        {
          studentId: 1,
          topicId: 3,
          score: 90,
          recordedAt: new Date(Date.UTC(2024, 8, 1)),
        },
      ],
      { yearGroup: null, subject: "Maths" },
    );

    const presentSubjects = [
      ...new Set(insights.termSubjectPerformance.map((t) => t.subject)),
    ];
    expect(presentSubjects).toEqual(["Maths"]);

    const autumn = insights.termSubjectPerformance.find(
      (t) => t.term === "Autumn",
    );
    expect(autumn?.average).toBe(70);
  });

  it("builds a selected-subject topic breakdown for an expanded student", () => {
    const result = buildStudentTopicInsights(1, "Maths", topics, [
      { studentId: 1, topicId: 1, score: 30 },
      { studentId: 1, topicId: 1, score: 50 },
      { studentId: 1, topicId: 2, score: 80 },
      { studentId: 1, topicId: 3, score: 100 },
    ]);

    expect(result).toEqual([
      {
        id: 1,
        name: "Algebra",
        subject: "Maths",
        average: 40,
        recordCount: 2,
      },
      {
        id: 2,
        name: "Geometry",
        subject: "Maths",
        average: 80,
        recordCount: 1,
      },
    ]);
  });

  it("builds null-safe individual student subjects, focus areas and strengths", () => {
    const result = buildStudentRecordInsight(1, topics, [
      { studentId: 1, topicId: 1, score: 0 },
      { studentId: 1, topicId: 2, score: 80 },
    ]);

    expect(result.overallAverage).toBe(40);
    expect(result.subjects).toEqual([
      { subject: "Maths", average: 40, recordCount: 2 },
      { subject: "Science", average: null, recordCount: 0 },
    ]);
    expect(result.focusAreas).toEqual([
      {
        key: "topic:1",
        label: "Algebra",
        detail: "Topic",
        average: 0,
        recordCount: 1,
      },
    ]);
    expect(result.strengths[0]).toEqual({
      key: "topic:2",
      label: "Geometry",
      detail: "Topic",
      average: 80,
      recordCount: 1,
    });
  });
});
