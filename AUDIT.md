# Audit Notes

## What I found

- Progress scores were not validated at the server boundary. Empty values could become `0`, and negative, decimal, `NaN`, or above-100 values could reach the database. The action also accepted `any`. Through manual testing I found that values such as `-5`, `10000`, and `6.7` were accepted or transformed unexpectedly. I found this through manual testing and code inspection in `ProgressForm.tsx` and `server.actions.ts`.

- Calculating an average for a student with no progress divided by zero and produced `NaN`. AI review highlighted the edge case, which I then confirmed by inspecting `getAverageForStudent`.

- Teachers could enter progress notes when recording a score, but the student progress log never displayed them. This meant useful context was effectively lost after submission. I found this by manually following the record-entry workflow and checking `students/[id]/page.tsx`.

- The top navigation did not clearly identify the current section. When moving between Students, Topics, Progress, and nested student pages, there was no active-state indication, making it easy for teachers to lose track of where they were.

- The student progress view had no filtering capabilities, making it difficult to review records by subject, topic, or score once a student accumulated a larger history.

- There was no edit or delete workflow available through the UI for progress records. The codebase contains deletion logic, but it is not currently exposed through the UI and is not consistently implemented across the existing actions.

- Forms provided no success or failure feedback after some actions, leaving users without confirmation that an operation had completed successfully.

- SQLite runtime files and TypeScript build-info files were not fully ignored, so generated files could appear in Git status.

- Several starter components used raw Tailwind palette colours rather than the semantic tokens defined by the project.

- The schema includes `deletedAt`, but the original actions do not consistently soft-delete or filter deleted rows. I found this through code inspection.

- Dates use `toLocaleDateString()` without an explicit UK locale, so output can vary with the runtime environment and may not match the expected UK format (`dd/mm/yyyy`).

## What I fixed and why

- **Score validation:** added Zod validation to `recordProgress`, changed its
  boundary type from `any` to `unknown`, and used `safeParse` to return a
  controlled error rather than throwing. `ProgressForm.tsx` also gives immediate
  client-side feedback, while the server remains the source of truth. This was
  the highest-priority data-integrity issue because an invalid score could be
  persisted or crash the request. `record-progress.test.ts` covers empty,
  negative, decimal, `NaN`, `101`, `999`, `10000`, and valid `0`/`100` scores.

- **Empty averages:** `getAverageForStudent` now returns `null` when there are no
  records, and `AverageScoreWidget` displays an em dash with a clear empty
  message. This avoids presenting `NaN` or using `0` to represent missing data.
  `average-score.test.ts` provides regression coverage.

- **Navigation state:** moved navigation into a pathname-aware component with
  exact home matching and prefix matching for nested routes. This gives teachers
  a clear sense of location and also supports the new Insights section.

- **Progress notes:** added a compact Notes column with an accessible
  open/close control. Long notes wrap inside the progress card, restoring the
  context teachers recorded alongside a score.

- **Generated-file hygiene:** added SQLite WAL/SHM and TypeScript build-info
  files to `.gitignore`.

- **Semantic colours:** replaced remaining raw red/yellow/green/blue classes in
  the touched UI with the repository's error, warning, success, and primary
  tokens.

- **CSS import declaration:** added a global CSS module declaration instead of
  suppressing the TypeScript diagnostic.

- **Cohort Insights:** added a new `/insights` page providing cohort-level analytics across students. The feature includes year-group and subject filtering, score-band distributions, topic strengths and gaps, term-based performance trends, and individual student insights. Particular attention was paid to empty states, small sample sizes, and avoiding misleading conclusions through record-count indicators and confidence thresholds. Behaviour-focused tests were added for the underlying analytics calculations.


## What I deferred and why

- **Consistent soft deletion:** I noticed some inconsistency around deletion behaviour, but there is currently no edit or delete workflow available in the UI. Given the time available, I prioritised issues affecting the visible teacher workflow and deferred a deeper review of deletion semantics until record management becomes a user-facing feature.

- **Editing/deleting progress records:** there is currently no edit or delete workflow for progress records. I chose not to expand the scope because this was outside the task requirements and did not affect the current teacher workflow. If record correction becomes a requirement, I would revisit edit/delete behaviour together with the soft-delete approach.

- **Progress-log filtering and expanded topic management:** as the number of records grows, it would be useful to filter a student's history by subject, topic, score, or date range. It would also be useful to provide more topic-management functionality. I chose not to prioritise this because it was not required for the task and was lower value than validation, analytics correctness, navigation, and visibility of existing information.

- **Explicit UK date formatting:** dates currently depend on the server/browser locale and may not always display in UK format (`dd/mm/yyyy`). I deferred this because it is primarily a presentation issue and less impactful than the validation and analytics work completed during the exercise.

- **Browser-level interaction tests:** navigation highlighting, notes expansion, filters, and expandable insight rows were manually verified. I deferred automated browser-level tests because the existing test setup is focused on unit/behaviour tests, and the higher priority was regression coverage for persisted scores and analytics calculations.
  
- **User feedback after actions:** some workflows do not provide a clear success or failure message after an action is completed. While this does not affect data correctness, it would improve the teacher experience by providing confirmation that a record has been saved successfully and reducing the risk of users repeating actions unnecessarily. Given the time available, I prioritised validation, analytics, and data integrity improvements first.

## What I'd argue is the biggest problem with the codebase

The biggest issue was trust in the data presented to teachers. Invalid scores could be persisted, empty datasets could produce `NaN`, progress notes were recorded but not visible afterwards, and deletion behaviour was not fully consistent with the schema design. While each issue was relatively small in isolation, together they reduced confidence in the information shown by the application. For that reason, I prioritised validation, data correctness, clear empty states, and visibility of recorded information before adding new functionality.
