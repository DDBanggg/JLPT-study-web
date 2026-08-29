import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GrammarViewer, GrammarUserState } from "../../src/components/learn/GrammarViewer";
import { GrammarItem } from "../../src/components/learn/GrammarCard";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/learn/grammar/day/2",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F4 — Grammar Real Interaction Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockGrammarItems: GrammarItem[] = [
    {
      id: 201,
      structure: "N を Vます",
      formation: ["N + を + Vます"],
      meaning_vi: "Đánh dấu tân ngữ trực tiếp của động từ.",
      usage_vi: "Dùng を sau danh từ chịu tác động trực tiếp của hành động.",
      examples: [
        {
          jp: "わたしは本を読みます。",
          reading: "わたしはほんをよみます。",
          vi: "Tôi đọc sách.",
        },
      ],
      notes_vi: ["を đọc là「お」."],
      source_ref: "Minna no Nihongo I — Lesson 6",
    },
    {
      id: 202,
      structure: "N で Vます",
      formation: ["N + で + Vます"],
      meaning_vi: "Chỉ phương tiện, địa điểm diễn ra hành động.",
      examples: [],
    },
  ];

  it("calls markViewed on Next, only shows Complete button on final card, and completes with backend next_task", async () => {
    const calledUrls: string[] = [];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      calledUrls.push(url);
      if (url.includes("/api/progress/complete")) {
        return Promise.resolve({
          status: 200,
          json: async () => ({
            ok: true,
            data: {
              completed: true,
              next_task: {
                task_id: "grammar_test_day_2",
                task_type: "grammar_test",
                label: "Grammar Test Day 2",
                href: "/test/grammar",
              },
            },
          }),
        } as Response);
      }
      return Promise.resolve({ status: 200, json: async () => ({ ok: true }) } as Response);
    });

    const userState: GrammarUserState = {
      viewed_ids: [],
      viewed_count: 0,
      total_count: 2,
      completed: false,
    };

    render(
      <GrammarViewer
        studyDay={2}
        items={mockGrammarItems}
        userState={userState}
      />
    );

    // Initial card: Card 1 (non-final) -> should have "Mẫu tiếp theo", NO "Hoàn thành Grammar"
    expect(screen.getByText("N を Vます")).toBeDefined();
    expect(screen.getByRole("button", { name: /Mẫu tiếp theo/i })).toBeDefined();
    expect(screen.queryByRole("button", { name: /Hoàn thành Grammar/i })).toBeNull();

    // Click Next
    await userEvent.click(screen.getByRole("button", { name: /Mẫu tiếp theo/i }));

    // Should call /api/grammar/viewed for card 201
    expect(calledUrls).toContain("/api/grammar/viewed");

    // Now on final card: Card 2 -> should show "Hoàn thành Grammar", NO "Mẫu tiếp theo"
    await waitFor(() => {
      expect(screen.getByText("N で Vます")).toBeDefined();
      expect(screen.getByRole("button", { name: /Hoàn thành Grammar/i })).toBeDefined();
      expect(screen.queryByRole("button", { name: /Mẫu tiếp theo/i })).toBeNull();
    });

    // Click Complete
    await userEvent.click(screen.getByRole("button", { name: /Hoàn thành Grammar/i }));

    // Verify /api/progress/complete was called and backend CTA rendered
    await waitFor(() => {
      expect(calledUrls).toContain("/api/progress/complete");
      expect(screen.getByText("Grammar Test Day 2")).toBeDefined();
    });
  });
});
