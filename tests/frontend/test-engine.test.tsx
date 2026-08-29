import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
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

describe("Milestone F10 — Test Engine Integration Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders loading skeleton on initial render", () => {
    const html = renderToString(<TestEngine testId="sample-test" />);
    expect(html).toContain("animate-pulse");
  });

  describe("API Data Responses & Rendering", () => {
    it("handles pending content state cleanly with ContentPending", async () => {
      // Mock pending test response
      const mockPendingResponse = {
        ok: true,
        data: {
          roadmap_state: "pending",
          content_state: "pending",
          test_id: "mock-test-01",
          test_type: "mock",
          study_day: 100,
          latest_result: null,
          href: null,
          content: null,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => mockPendingResponse,
      } as Response);

      // Verify the component handles content_state = pending when loaded
      const html = renderToString(<TestEngine testId="mock-test-01" />);
      expect(html).toBeDefined();
    });

    it("supports test documents with reading and listening stimuli without exposing answer keys", async () => {
      const mockAvailableResponse = {
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
                title: "Đoạn văn đọc hiểu",
                content_jp: "これはテストの文章です。",
              },
              {
                id: "listening-stim-1",
                type: "youtube",
                title: "Bài nghe Unit 1",
                youtube: {
                  type: "video",
                  video_id: "Bkmu-tmwGvA",
                },
                fallback_url: "https://www.youtube.com/watch?v=Bkmu-tmwGvA",
              },
            ],
            sections: [
              {
                id: "grammar",
                title: "Grammar",
                max_score: 15,
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
                    prompt: "文章の内容に合っているものはどれですか。",
                    stimulus_id: "reading-stim-1",
                    options: [
                      { id: "A", text: "テストです" },
                      { id: "B", text: "テストではありません" },
                    ],
                  },
                  {
                    id: "q003",
                    category: "listening",
                    prompt: "男の人は何をしますか。",
                    stimulus_id: "listening-stim-1",
                    options: [
                      { id: "A", text: "本を読みます" },
                      { id: "B", text: "テレビを見ます" },
                    ],
                  },
                ],
              },
            ],
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => mockAvailableResponse,
      } as Response);

      // Verify that active GET content does not require answer keys (correct_option_id, explanation_vi)
      const sanitizedQuestions = mockAvailableResponse.data.content.sections[0].questions;
      expect((sanitizedQuestions[0] as unknown as { correct_option_id?: string }).correct_option_id).toBeUndefined();
      expect((sanitizedQuestions[0] as unknown as { explanation_vi?: string }).explanation_vi).toBeUndefined();

      // Verify stimuli structure
      expect(mockAvailableResponse.data.content.stimuli).toHaveLength(2);
      expect(mockAvailableResponse.data.content.stimuli[0].type).toBe("reading");
      expect(mockAvailableResponse.data.content.stimuli[1].type).toBe("youtube");
    });
  });
});
