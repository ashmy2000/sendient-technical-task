# AI Notes

This file is required. We use it to understand how you collaborated with AI tools. **Please be specific** — generic statements like "I used Claude to write some code" don't tell us anything.

Aim for ~10 minutes on this. Quality over length.

---

## 1. Tools you used

Which AI tools did you reach for, and for what kinds of work? (e.g., Claude Code / Cursor / ChatGPT / Copilot, used for architecture sketching / code generation / test scaffolding / refactor proposals / domain research, etc.)

- **Codex (GPT-5.5, Medium reasoning):** This was my primary implementation tool throughout the exercise. I used it as a repository-aware engineering assistant to inspect the existing codebase, propose implementation plans, modify files, generate tests, run verification commands, review diffs, and identify potential edge cases. I generally used it to analyse a problem first, review the proposed approach, and then execute changes once I was satisfied with the plan.

- **Claude Code (Sonnet, Medium reasoning):** I used Claude Code as a secondary review tool. Whenever Codex proposed a significant change, I used Claude Code to verify the implementation against the README requirements, check for convention violations, identify anything potentially misleading to teachers, and review uncommitted changes before committing. One example was the Cohort Insights visualisation, where I wanted to change the cohort performance chart (Horizontal Bars graph). After several prompts, Codex was not producing the visualisation I was looking for (bar graph / line graph), so I used Claude Code to review the requirement and generate an alternative implementation, which achieved the desired result in a single iteration.

- **ChatGPT (GPT-5.5 Instant):** I used ChatGPT primarily for planning, requirements analysis, documentation support, prompt refinement, and technical discussions. It was particularly useful for helping me think through trade-offs, identify what should be prioritised within the available time, structure my audit findings, and validate whether proposed analytics could mislead teachers.

- **Gemini 2.5 Pro:** I used Gemini during the early design phase of the Cohort Insights feature to brainstorm possible teacher-facing analytics and dashboard layouts. I also used it to explore questions around academic years, cohort reporting, educational grading approaches, and the types of insights a teacher would find genuinely useful. The output was used as a source of ideas rather than implementation instructions.

---

## 2. Where AI took you further than you could have gone alone

This is the part we care most about. Pick **one or two specific things** in your submission that you would not have delivered (or would not have delivered at this quality) in the time available without AI.

For each one:

- **What it is** (point at file/line if possible).
- **Where AI helped** — the prompt or interaction shape, the suggestion, the option-generation, whatever it was.
- **What you did to verify it** — read it carefully, ran tests, sanity-checked the edge case, rejected one of the options it gave, etc.

### Cohort Insights

* **What it is:** `src/app/insights/page.tsx`, `src/components/InsightsDashboard.tsx`, and `src/lib/insights.ts` provide a cohort/year-group and subject dashboard with score bands, topic comparisons, term summaries, expandable student details, and evidence-qualified focus areas and strengths.

* **Where AI helped:** Gemini 2.5 Pro helped me brainstorm what a teacher would actually want to see from a cohort insights dashboard, including cohort trends, subject performance, student support indicators, and how academic years are typically viewed in schools. I then used ChatGPT to turn my rough ideas into clearer requirements and implementation prompts. Those prompts were fed into Codex, which generated implementation plans, created the required files, produced analytics logic, added tests, and allowed me to iterate quickly on the feature. Claude Code was then used as a secondary reviewer to validate the implementation against the README requirements and project conventions.

* **What I did to verify it:** I reviewed the generated analytics logic and manually tested the UI after each major change. I checked that navigation highlighting worked correctly, filters updated the dashboard as expected, expandable student sections opened and closed correctly, links navigated to the correct pages, and the displayed data matched the selected cohort and subject. I also reviewed calculations for edge cases such as empty datasets, unequal record counts, genuine zero scores, and null outputs. Finally, I ran the full test suite, strict typecheck, and production build to verify the implementation before submission.


### Regression discovery and coverage

* **What it is:** server-side score validation and null-safe empty averages in `server.actions.ts`, with regression coverage in `record-progress.test.ts` and `average-score.test.ts`.

* **Where AI helped:** I initially discovered the validation issues through manual UI testing. While testing the record-entry flow, I found that values such as empty input, decimals, negative numbers, `101`, `999`, and `10000` could be submitted or handled incorrectly. I used ChatGPT to help refine the problem into clear implementation requirements and prompts, then used Codex to generate the validation logic and test coverage. Claude Code reviewed the implementation and suggested strengthening the validation at the server boundary rather than relying primarily on client-side checks, which I adopted.

* **What I did to verify it:** I manually tested the UI using invalid and boundary values, including empty input, decimals, negative values, `101`, `999`, and `10000`, and verified that invalid records were rejected. I also reviewed the generated code using Claude Code as a secondary reviewer, compared its recommendations against the Codex implementation, and updated the approach where appropriate. Finally, I verified that valid boundary values such as `0` and `100` were accepted correctly and that a genuine score of `0` remained distinct from missing data.


---

## 3. Where AI was wrong, shallow, or unhelpful

What did AI get wrong, miss, or oversimplify? What did you have to correct? Where did you decide to *not* take its suggestion?

- An early validation change detected invalid scores but allowed Zod to throw,
  producing a 500 response for `10000`. Manual browser testing exposed this, so
  I changed the server action to controlled `safeParse` handling.

- Claude Code suggested that `text-error` might not be a valid Tailwind token. I
  checked `tailwind.config.ts` and the CSS variables, confirmed that `error` is
  deliberately defined, and rejected the suggestion.

- During development of the Cohort Insights page, I suggested displaying percentage-to-grade mappings alongside scores because that is how I initially expected teachers might view attainment data. I discussed the idea with Gemini while researching how schools typically present performance information and then asked ChatGPT to help turn the idea into an implementation prompt. After reviewing the result against the README requirements, I realised the approach could be misleading because the repository did not define an official grading scheme and different schools may map percentages differently. The README specifically warned against presenting information that could mislead teachers. I therefore removed the grade labels and kept the dashboard focused on the recorded percentages and supporting evidence instead.

- Initial term analytics grouped records only by calendar month and could mix
  academic years. A later review caught this, and I constrained term
  calculations to the latest September-to-July academic year.
- Initial strengths logic simply selected the top three topics, even if they
  were low-scoring or based on one record. I changed it to require at least 70%
  across two records. Low topics now distinguish an `early concern` from a
  better-supported `may need focus` signal.
- Claude Code flagged the use of semantic colour tokens as a potential issue. Before making any changes, I checked the project's Tailwind configuration and existing implementation, confirmed the tokens were intentionally defined, and rejected the suggestion. This reinforced the importance of verifying AI recommendations against the actual codebase rather than accepting them automatically.

---

## 4. If you had another hour, what would you have done with it?

I would use AI to map every remaining soft-delete inconsistency across actions, queries, and relationships, then generate a coordinated migration and test plan rather than addressing deletion behaviour piecemeal.

I would also use AI to generate browser-level interaction tests covering navigation highlighting, notes expansion, student drill-down behaviour, and the main Cohort Insights filtering workflow. These areas were manually tested during the exercise but not covered by automated browser tests.
