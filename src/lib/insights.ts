export interface InsightStudent {
  readonly id: number;
  readonly name: string;
  readonly yearGroup: number;
}

export interface InsightTopic {
  readonly id: number;
  readonly name: string;
  readonly subject: string;
}

export interface InsightRecord {
  readonly studentId: number;
  readonly topicId: number;
  readonly score: number;
  readonly recordedAt: Date;
}

export type InsightRecordInput = Omit<InsightRecord, "recordedAt"> & {
  readonly recordedAt?: Date;
};

export interface InsightFilters {
  readonly yearGroup: number | null;
  readonly subject: string | null;
}

export type ScoreBandKey = "below50" | "50to59" | "60to69" | "70plus";

export interface StudentAverageInsight {
  readonly id: number;
  readonly name: string;
  readonly yearGroup: number;
  readonly selectedAverage: number;
  readonly overallAverage: number;
  readonly recordCount: number;
}

export interface ScoreBandInsight {
  readonly key: ScoreBandKey;
  readonly label: string;
  readonly count: number;
  readonly percentage: number;
  readonly students: ReadonlyArray<StudentAverageInsight>;
}

export interface TopicInsight {
  readonly id: number;
  readonly name: string;
  readonly subject: string;
  readonly average: number;
  readonly studentCount: number;
  readonly recordCount: number;
}

export type TermKey = "Autumn" | "Spring" | "Summer";

export interface TermSubjectInsight {
  readonly term: TermKey;
  readonly subject: string;
  readonly average: number | null;
  readonly recordCount: number;
}

export interface StudentTopicInsight {
  readonly id: number;
  readonly name: string;
  readonly subject: string;
  readonly average: number;
  readonly recordCount: number;
}

export interface StudentSubjectInsight {
  readonly subject: string;
  readonly average: number | null;
  readonly recordCount: number;
}

export interface StudentAreaInsight {
  readonly key: string;
  readonly label: string;
  readonly detail: "Subject" | "Topic";
  readonly average: number;
  readonly recordCount: number;
}

export interface StudentRecordInsight {
  readonly studentId: number;
  readonly overallAverage: number | null;
  readonly subjects: ReadonlyArray<StudentSubjectInsight>;
  readonly focusAreas: ReadonlyArray<StudentAreaInsight>;
  readonly strengths: ReadonlyArray<StudentAreaInsight>;
}

export interface CohortInsights {
  readonly summary: {
    readonly totalStudents: number;
    readonly assessedStudents: number;
    readonly totalRecords: number;
    readonly cohortAverage: number | null;
  };
  readonly bands: ReadonlyArray<ScoreBandInsight>;
  readonly topics: ReadonlyArray<TopicInsight>;
  readonly termSubjectPerformance: ReadonlyArray<TermSubjectInsight>;
}

export interface CohortInsightData {
  readonly students: ReadonlyArray<InsightStudent>;
  readonly topics: ReadonlyArray<InsightTopic>;
  readonly records: ReadonlyArray<InsightRecord>;
}

function average(values: ReadonlyArray<number>): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function addScore(
  scoresByKey: Map<number, number[]>,
  key: number,
  score: number,
): void {
  const scores = scoresByKey.get(key);
  if (scores) {
    scores.push(score);
  } else {
    scoresByKey.set(key, [score]);
  }
}

function getScoreBand(averageScore: number): ScoreBandKey {
  if (averageScore >= 70) return "70plus";
  if (averageScore >= 60) return "60to69";
  if (averageScore >= 50) return "50to59";
  return "below50";
}

const ukTerms: ReadonlyArray<{ term: TermKey; months: ReadonlyArray<number> }> =
  [
    { term: "Autumn", months: [8, 9, 10, 11] },
    { term: "Spring", months: [0, 1, 2, 3] },
    { term: "Summer", months: [4, 5, 6] },
  ];

function getAcademicYearStart(date: Date): number | null {
  const month = date.getUTCMonth();
  if (month >= 8) return date.getUTCFullYear();
  if (month <= 6) return date.getUTCFullYear() - 1;
  return null;
}

export function buildStudentTopicInsights(
  studentId: number,
  subject: string | null,
  topics: ReadonlyArray<InsightTopic>,
  records: ReadonlyArray<InsightRecordInput>,
): ReadonlyArray<StudentTopicInsight> {
  const filteredTopics = topics.filter(
    (topic) => subject == null || topic.subject === subject,
  );

  return filteredTopics
    .flatMap((topic): StudentTopicInsight[] => {
      const scores = records
        .filter(
          (record) =>
            record.studentId === studentId && record.topicId === topic.id,
        )
        .map((record) => record.score);
      const topicAverage = average(scores);
      if (topicAverage == null) return [];

      return [
        {
          id: topic.id,
          name: topic.name,
          subject: topic.subject,
          average: topicAverage,
          recordCount: scores.length,
        },
      ];
    })
    .sort(
      (a, b) =>
        a.average - b.average ||
        a.subject.localeCompare(b.subject) ||
        a.name.localeCompare(b.name),
    );
}

export function buildStudentRecordInsight(
  studentId: number,
  topics: ReadonlyArray<InsightTopic>,
  records: ReadonlyArray<InsightRecordInput>,
): StudentRecordInsight {
  const studentRecords = records.filter(
    (record) => record.studentId === studentId,
  );
  const topicInsights = buildStudentTopicInsights(
    studentId,
    null,
    topics,
    records,
  );
  const subjects = Array.from(new Set(topics.map((topic) => topic.subject)))
    .sort((a, b) => a.localeCompare(b))
    .map((subject): StudentSubjectInsight => {
      const topicIds = new Set(
        topics
          .filter((topic) => topic.subject === subject)
          .map((topic) => topic.id),
      );
      const scores = studentRecords
        .filter((record) => topicIds.has(record.topicId))
        .map((record) => record.score);

      return {
        subject,
        average: average(scores),
        recordCount: scores.length,
      };
    });
  const topicAreas = topicInsights.map(
    (topic): StudentAreaInsight => ({
      key: `topic:${topic.id}`,
      label: topic.name,
      detail: "Topic",
      average: topic.average,
      recordCount: topic.recordCount,
    }),
  );

  return {
    studentId,
    overallAverage: average(studentRecords.map((record) => record.score)),
    subjects,
    focusAreas: topicAreas
      .filter((area) => area.average < 50)
      .sort(
        (a, b) =>
          a.average - b.average || a.label.localeCompare(b.label),
      ),
    strengths: [...topicAreas]
      .sort(
        (a, b) =>
          b.average - a.average ||
          a.label.localeCompare(b.label),
      )
      .slice(0, 3),
  };
}

export function buildCohortInsights(
  students: ReadonlyArray<InsightStudent>,
  topics: ReadonlyArray<InsightTopic>,
  records: ReadonlyArray<InsightRecordInput>,
  filters: InsightFilters = { yearGroup: null, subject: null },
): CohortInsights {
  const filteredStudents = students.filter(
    (student) =>
      filters.yearGroup == null || student.yearGroup === filters.yearGroup,
  );
  const filteredTopics = topics.filter(
    (topic) => filters.subject == null || topic.subject === filters.subject,
  );
  const studentIds = new Set(filteredStudents.map((student) => student.id));
  const topicIds = new Set(filteredTopics.map((topic) => topic.id));
  const allTopicIds = new Set(topics.map((topic) => topic.id));

  const overallRecords = records.filter(
    (record) =>
      studentIds.has(record.studentId) && allTopicIds.has(record.topicId),
  );
  const selectedRecords = overallRecords.filter((record) =>
    topicIds.has(record.topicId),
  );

  const overallScoresByStudent = new Map<number, number[]>();
  for (const record of overallRecords) {
    addScore(overallScoresByStudent, record.studentId, record.score);
  }

  const selectedScoresByStudent = new Map<number, number[]>();
  for (const record of selectedRecords) {
    addScore(selectedScoresByStudent, record.studentId, record.score);
  }

  const assessedStudents = filteredStudents.flatMap(
    (student): StudentAverageInsight[] => {
      const selectedScores = selectedScoresByStudent.get(student.id) ?? [];
      const selectedAverage = average(selectedScores);
      if (selectedAverage == null) return [];

      return [
        {
          id: student.id,
          name: student.name,
          yearGroup: student.yearGroup,
          selectedAverage,
          overallAverage:
            average(overallScoresByStudent.get(student.id) ?? []) ??
            selectedAverage,
          recordCount: selectedScores.length,
        },
      ];
    },
  );

  const bandDefinitions: ReadonlyArray<{
    key: ScoreBandKey;
    label: string;
  }> = [
    { key: "below50", label: "Below 50%" },
    { key: "50to59", label: "50–59%" },
    { key: "60to69", label: "60–69%" },
    { key: "70plus", label: "70%+" },
  ];
  const bands = bandDefinitions.map((definition): ScoreBandInsight => {
    const bandStudents = assessedStudents
      .filter(
        (student) => getScoreBand(student.selectedAverage) === definition.key,
      )
      .sort(
        (a, b) =>
          a.selectedAverage - b.selectedAverage ||
          a.name.localeCompare(b.name),
      );

    return {
      ...definition,
      count: bandStudents.length,
      percentage:
        assessedStudents.length === 0
          ? 0
          : (bandStudents.length / assessedStudents.length) * 100,
      students: bandStudents,
    };
  });

  const topicsWithData = filteredTopics.flatMap((topic): TopicInsight[] => {
    const topicRecords = selectedRecords.filter(
      (record) => record.topicId === topic.id,
    );
    const scoresByStudent = new Map<number, number[]>();
    for (const record of topicRecords) {
      addScore(scoresByStudent, record.studentId, record.score);
    }
    const studentAverages = Array.from(scoresByStudent.values())
      .map(average)
      .filter((value): value is number => value != null);
    const topicAverage = average(studentAverages);
    if (topicAverage == null || studentAverages.length < 3) return [];

    return [
      {
        id: topic.id,
        name: topic.name,
        subject: topic.subject,
        average: topicAverage,
        studentCount: studentAverages.length,
        recordCount: topicRecords.length,
      },
    ];
  });

  const latestAcademicYearStart = selectedRecords.reduce<number | null>(
    (latest, record) => {
      if (record.recordedAt == null) return latest;
      const academicYearStart = getAcademicYearStart(record.recordedAt);
      if (academicYearStart == null) return latest;
      return latest == null || academicYearStart > latest
        ? academicYearStart
        : latest;
    },
    null,
  );
  const latestAcademicYearRecords =
    latestAcademicYearStart == null
      ? []
      : selectedRecords.filter(
          (record) =>
            record.recordedAt != null &&
            getAcademicYearStart(record.recordedAt) ===
              latestAcademicYearStart,
        );

  return {
    summary: {
      totalStudents: filteredStudents.length,
      assessedStudents: assessedStudents.length,
      totalRecords: selectedRecords.length,
      cohortAverage: average(
        assessedStudents.map((student) => student.selectedAverage),
      ),
    },
    bands,
    topics: topicsWithData.sort(
      (a, b) =>
        a.average - b.average ||
        a.subject.localeCompare(b.subject) ||
        a.name.localeCompare(b.name),
    ),
    termSubjectPerformance: (() => {
      const subjectNames = Array.from(
        new Set(filteredTopics.map((t) => t.subject)),
      ).sort((a, b) => a.localeCompare(b));

      return ukTerms.flatMap(({ term, months }): TermSubjectInsight[] => {
        const termMonthSet = new Set(months);
        const termRecords = latestAcademicYearRecords.filter(
          (record) =>
            record.recordedAt != null &&
            termMonthSet.has(record.recordedAt.getUTCMonth()),
        );

        return subjectNames.map((subjectName): TermSubjectInsight => {
          const subjectTopicIds = new Set(
            filteredTopics
              .filter((t) => t.subject === subjectName)
              .map((t) => t.id),
          );
          const subjectTermRecords = termRecords.filter((r) =>
            subjectTopicIds.has(r.topicId),
          );
          const scoresByStudent = new Map<number, number[]>();
          for (const record of subjectTermRecords) {
            addScore(scoresByStudent, record.studentId, record.score);
          }
          const studentAverages = Array.from(scoresByStudent.values())
            .map(average)
            .filter((v): v is number => v != null);

          return {
            term,
            subject: subjectName,
            average: average(studentAverages),
            recordCount: subjectTermRecords.length,
          };
        });
      });
    })(),
  };
}
