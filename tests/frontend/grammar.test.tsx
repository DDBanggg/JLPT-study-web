import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { GrammarCard, GrammarItem } from "../../src/components/learn/GrammarCard";
import { GrammarViewer, GrammarUserState } from "../../src/components/learn/GrammarViewer";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/learn/grammar/day/2",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F4 — Grammar Components", () => {
  const mockGrammarItem: GrammarItem = {
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
  };

  describe("GrammarCard", () => {
    it("renders grammar structure, meaning, formation, and examples", () => {
      const html = renderToString(
        <GrammarCard item={mockGrammarItem} index={0} total={1} isViewed={false} />
      );

      expect(html).toContain("N を Vます");
      expect(html).toContain("N + を + Vます");
      expect(html).toContain("Đánh dấu tân ngữ trực tiếp của động từ.");
      expect(html).toContain("Tôi đọc sách.");
      expect(html).toContain("Minna no Nihongo I — Lesson 6");
      expect(html).toContain("Chưa xem");
    });

    it("displays Đã xem badge when isViewed is true", () => {
      const html = renderToString(
        <GrammarCard item={mockGrammarItem} index={0} total={1} isViewed={true} />
      );
      expect(html).toContain("Đã xem");
    });
  });

  describe("GrammarViewer", () => {
    it("renders navigation controls and completion button", () => {
      const mockUserState: GrammarUserState = {
        viewed_ids: [201],
        viewed_count: 1,
        total_count: 1,
        completed: false,
      };

      const html = renderToString(
        <GrammarViewer
          studyDay={2}
          items={[mockGrammarItem]}
          userState={mockUserState}
        />
      );

      expect(html).toContain("Grammar");
      expect(html).toContain("Ngày");
      expect(html).toContain("Đã xem:");
      expect(html).toContain("Hoàn thành Grammar");
    });
  });
});
