import { describe, expect, it } from "vitest";

import {
  countCompletedStudyDays,
  deriveProgramData,
  PROGRAM_ID,
} from "../../src/lib/progress/program";

describe("program DTO derivation", () => {
  it("matches the configured-program contract", () => {
    expect(
      deriveProgramData(
        {
          program_id: PROGRAM_ID,
          progress_start_date: "2026-08-27",
          exam_date: "2026-12-06",
        },
        1,
        "2026-08-28",
      ),
    ).toEqual({
      program_id: PROGRAM_ID,
      progress_start_date: "2026-08-27",
      exam_date: "2026-12-06",
      projected_day_100_date: "2026-12-04",
      current_study_day: 2,
      completed_study_days: 1,
      progress_percent: 1,
      days_until_exam: 100,
    });
  });

  it("counts a day only when every required roadmap task is complete", () => {
    const roadmap = {
      program_id: PROGRAM_ID,
      total_days: 100,
      days: [
        {
          day: 1,
          tasks: [
            { task_id: "grammar_day_1", type: "grammar", required: true },
            { task_id: "listening_day_1", type: "listening", required: true },
            { task_id: "bonus_day_1", type: "reading", required: false },
          ],
        },
        {
          day: 2,
          tasks: [{ task_id: "grammar_day_2", type: "grammar", required: true }],
        },
      ],
    };
    const completedTasks = [
      { study_day: 1, task_type: "grammar", task_id: "grammar_day_1" },
      { study_day: 1, task_type: "listening", task_id: "listening_day_1" },
    ];

    expect(countCompletedStudyDays(roadmap, completedTasks)).toBe(1);
  });
});
