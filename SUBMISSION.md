# Submission Notes

This submission focuses on data correctness, teacher-facing usability improvements, and cohort-level analytics, while prioritising changes that directly affected the current workflow and avoiding assumptions that could mislead users.

## If  I had more time: 

- I would make UK date formatting explicit throughout the application rather than relying on the runtime locale. This would ensure all users consistently see dates in `dd/mm/yyyy` format.

- I would add success and failure toast notifications when teachers create progress records. At the moment a record is saved correctly, but there is limited feedback confirming the action completed successfully. Clear notifications would reduce uncertainty and help prevent accidental duplicate submissions.

- For the Cohort Insights page, I would replace the current term-performance bar chart with a line graph. The purpose of that section is to help teachers understand whether cohort performance is improving, declining, or remaining stable across Autumn, Spring, and Summer terms. A line graph would communicate trends more effectively than discrete bars.

- I would expand filtering capabilities across student records and cohort analytics. Useful additions would include filtering by subject, topic, score range, and date range, allowing teachers to investigate performance patterns more efficiently as the dataset grows.

- I would further refine the presentation of notes and student-record views. The current implementation is intentionally lightweight and functional, but additional time would allow for a more polished and visually engaging experience while preserving readability.


## Verification

- `pnpm test` — 32 tests passed
- `pnpm typecheck` — passed
- `pnpm build` — passed
- `git diff --check` — passed
  

