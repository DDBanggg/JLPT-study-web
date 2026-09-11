import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestEngine } from "../../src/components/test/TestEngine";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/test/daily/daily-003",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F10 — Real TestEngine DOM Interaction Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockAvailableTestDoc = {
    ok: true,
    data: {
      content_state: "available",
      test_id: "daily-003",
      test_type: "daily",
      study_day: 3,
      latest_result: null,
      href: "/test/daily/daily-003",
      content: {
        schema_version: 1,
        id: "daily-003",
        type: "daily",
        title: "Daily Test — Day 3",
        study_day: 3,
        coverage: { from_day: 2, to_day: 2 },
        stimuli: [
          {
            id: "reading-stim-1",
            type: "reading",
            title: "Bài đọc hiểu",
            content_jp: "これはテストの文章です。",
          },
          {
            id: "listening-stim-1",
            type: "youtube",
            title: "Audio nghe",
            youtube: {
              type: "video",
              video_id: "Bkmu-tmwGvA",
            },
            fallback_url: "https://www.youtube.com/watch?v=Bkmu-tmwGvA",
          },
        ],
        sections: [
          {
            id: "section_1",
            title: "Phần 1: Kiến thức",
            max_score: 20,
            questions: [
              {
                id: "q001",
                category: "grammar",
                prompt: "毎朝コーヒー＿＿飲みます。",
                stimulus_id: null,
                options: [
                  { id: "A", text: "を" },
                  { id: "B", text: "で" },
                ],
              },
              {
                id: "q002",
                category: "reading",
                prompt: "Nội dung câu văn là gì?",
                stimulus_id: "reading-stim-1",
                options: [
                  { id: "A", text: "Bài đọc thử" },
                  { id: "B", text: "Khác" },
                ],
              },
            ],
          },
        ],
      },
    },
  };

  it("loads available test, allows selecting answers, warns on incomplete submit, and submits exact payload", async () => {
    let capturedSubmitBody: unknown = null;

    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/api/tests/daily-003/submit")) {
        capturedSubmitBody = JSON.parse(init?.body as string);
        return Promise.resolve({
          status: 200,
          json: async () => ({
            ok: true,
            data: {
              test_id: "daily-003",
              result: {
                score: 10,
                max_score: 20,
                percentage: 50,
                passed: true,
              },
              review: [
                {
                  question_id: "q001",
                  user_option_id: "A",
                  correct_option_id: "A",
                  correct: true,
                  explanation_vi: "Dùng を chỉ tân ngữ.",
                },
                {
                  question_id: "q002",
                  user_option_id: null,
                  correct_option_id: "A",
                  correct: false,
                  explanation_vi: "Chưa chọn đáp án.",
                },
              ],
              next_task: {
                task_id: "reading_day_3",
                task_type: "reading",
                label: "Reading Day 3",
                href: "/learn/reading/day/3",
              },
            },
          }),
        } as Response);
      }

      // Default GET test
      return Promise.resolve({
        status: 200,
        json: async () => mockAvailableTestDoc,
      } as Response);
    });

    render(<TestEngine testId="daily-003" />);

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText("毎朝コーヒー＿＿飲みます。")).toBeDefined();
    });

    // Check Reading Stimulus rendered
    expect(screen.getByText("Bài đọc hiểu")).toBeDefined();
    expect(screen.getByText("これはテストの文章です。")).toBeDefined();

    // Select Option A on Question 1
    const optionA = screen.getByText("を");
    await userEvent.click(optionA);

    // Try to submit with 1 unanswered question
    const submitBtn = screen.getAllByRole("button", { name: /Nộp bài thi/i })[0];
    await userEvent.click(submitBtn);

    // Warning confirmation modal should be visible
    await waitFor(() => {
      expect(screen.getByText(/Bạn còn 1 câu hỏi chưa trả lời/i)).toBeDefined();
    });

    // Confirm submit in modal
    const confirmSubmitBtn = screen.getByRole("button", { name: "Vẫn nộp bài" });
    await userEvent.click(confirmSubmitBtn);

    // Verify submitted payload
    await waitFor(() => {
      expect(capturedSubmitBody).toEqual({
        answers: [
          { question_id: "q001", option_id: "A" },
          { question_id: "q002", option_id: null },
        ],
      });
    });

    // Verify Review Mode displays score, explanations, and backend next_task CTA
    await waitFor(() => {
      expect(screen.getByText("10")).toBeDefined();
      expect(screen.getByText("Chính xác")).toBeDefined();
      expect(screen.getByText("Dùng を chỉ tân ngữ.")).toBeDefined();
      expect(screen.getByText("Reading Day 3")).toBeDefined();
    });
  });

  it("handles pending content state cleanly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          content_state: "pending",
          test_id: "mock-01",
          test_type: "mock",
          study_day: 100,
          latest_result: null,
          href: null,
          content: null,
        },
      }),
    } as Response);

    render(<TestEngine testId="mock-01" />);

    await waitFor(() => {
      expect(screen.getByText(/Đề thi chưa được chuẩn bị/i)).toBeDefined();
    });
  });

  it("renders Weekly results without Listening and with a /120 total", async () => {
    const weeklyContent = {
      schema_version: 1,
      id: "weekly-01",
      type: "weekly",
      title: "Weekly Test — Chapter 1",
      study_day: 18,
      stimuli: [],
      sections: [
        {
          id: "language",
          title: "Language Knowledge",
          max_score: 60,
          questions: [{
            id: "language-1",
            category: "grammar",
            prompt: "文法問題",
            stimulus_id: null,
            options: [{ id: "A", text: "言語A" }, { id: "B", text: "言語B" }],
          }],
        },
        {
          id: "reading",
          title: "Reading",
          max_score: 60,
          questions: [{
            id: "reading-1",
            category: "reading",
            prompt: "読解問題",
            stimulus_id: null,
            options: [{ id: "A", text: "読解A" }, { id: "B", text: "読解B" }],
          }],
        },
      ],
    };
    global.fetch = vi.fn().mockImplementation((url: string) => Promise.resolve({
      status: 200,
      json: async () => url.includes("/submit")
        ? {
            ok: true,
            data: {
              result: {
                test_id: "weekly-01",
                test_type: "weekly",
                score: null,
                max_score: null,
                language_score: 45,
                reading_score: 45,
                listening_score: null,
                total_score: 90,
              },
              review: [
                { question_id: "language-1", selected_option_id: "A", correct_option_id: "A", correct: true, explanation_vi: "" },
                { question_id: "reading-1", selected_option_id: "A", correct_option_id: "A", correct: true, explanation_vi: "" },
              ],
              next_task: null,
            },
          }
        : {
            ok: true,
            data: {
              content_state: "available",
              test_id: "weekly-01",
              test_type: "weekly",
              study_day: 18,
              latest_result: null,
              content: weeklyContent,
            },
          },
    } as Response));

    render(<TestEngine testId="weekly-01" />);
    await waitFor(() => expect(screen.getByText("文法問題")).toBeDefined());
    await userEvent.click(screen.getByText("言語A"));
    await userEvent.click(screen.getByText("読解A"));
    await userEvent.click(screen.getAllByRole("button", { name: /Nộp bài thi/i })[0]);

    await waitFor(() => {
      expect(screen.getByText((_, element) => element?.textContent === "90 / 120")).toBeDefined();
    });
    expect(screen.queryByText("Nghe hiểu")).toBeNull();
  });

  it("handles API error with ErrorState and Retry", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error("Network Error"));
      }
      return Promise.resolve({
        status: 200,
        json: async () => mockAvailableTestDoc,
      } as Response);
    });

    render(<TestEngine testId="daily-003" />);

    // Error message and retry button should appear
    await waitFor(() => {
      expect(screen.getByText(/Lỗi kết nối máy chủ/i)).toBeDefined();
    });

    const retryBtn = screen.getByRole("button", { name: "Thử lại" });
    fireEvent.click(retryBtn);

    // After retry, questions should load
    await waitFor(() => {
      expect(screen.getByText("毎朝コーヒー＿＿飲みます。")).toBeDefined();
    });
  });
});
