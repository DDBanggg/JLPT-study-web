export type TaskType =
  | "grammar"
  | "vocabulary"
  | "kanji"
  | "reading"
  | "listening"
  | "daily_test"
  | "weekly_test"
  | "monthly_test"
  | "end_test"
  | "mock_test";

export type TestType = "daily" | "weekly" | "monthly" | "end" | "mock";

export type ContentState = "available" | "pending";

export type TaskState = "pending" | "in_progress" | "finished";

export type CalendarStatus = "finished" | "late_finished" | "not_finished" | null;

export type ApiErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "INVALID_STUDY_DAY"
  | "PROGRAM_NOT_CONFIGURED"
  | "PROGRAM_ALREADY_CONFIGURED"
  | "CONTENT_PENDING"
  | "CONTENT_INVALID"
  | "TASK_NOT_FOUND"
  | "LEARNING_SET_INVALID"
  | "ITEM_NOT_FOUND"
  | "ITEM_ALREADY_KNOWN"
  | "TEST_NOT_FOUND"
  | "TEST_INVALID"
  | "INTERNAL_ERROR";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    field: string | null;
  };
}
