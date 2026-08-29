import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { KanjiTable, KanjiItem } from "../../src/components/learn/KanjiTable";
import { KanjiQuiz } from "../../src/components/learn/KanjiQuiz";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/learn/kanji/day/2/list",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F6 — Kanji Components", () => {
  const mockKanjiItems: KanjiItem[] = [
    {
      id: 201,
      kanji: "高",
      han_viet: "CAO",
      meaning_vi: "cao; đắt",
      onyomi: ["コウ"],
      kunyomi: ["たかい"],
      compounds: [
        {
          word: "高い山",
          reading: "たかいやま",
          meaning_vi: "núi cao",
        },
      ],
    },
    {
      id: 202,
      kanji: "安",
      han_viet: "AN",
      meaning_vi: "rẻ; yên ổn",
      onyomi: ["アン"],
      kunyomi: ["やすい"],
    },
  ];

  describe("KanjiTable", () => {
    it("renders kanji table with kanji, han_viet, reading, compounds, and Known action", () => {
      const html = renderToString(
        <KanjiTable
          studyDay={2}
          allItems={mockKanjiItems}
          learningSetIds={[201, 202]}
        />
      );

      expect(html).toContain("Kanji");
      expect(html).toContain("Ngày");
      expect(html).toContain("高");
      expect(html).toContain("CAO");
      expect(html).toContain("cao; đắt");
      expect(html).toContain("コウ");
      expect(html).toContain("たかい");
      expect(html).toContain("高い山");
      expect(html).toContain("Đã biết");
      expect(html).toContain("Hoàn thành Kanji");
    });
  });

  describe("KanjiQuiz", () => {
    it("renders flashcard with kanji without Known action button", () => {
      const html = renderToString(
        <KanjiQuiz
          studyDay={2}
          allItems={mockKanjiItems}
          learningSetIds={[201, 202]}
        />
      );

      expect(html).toContain("Kanji Quiz");
      expect(html).toContain("高");
      expect(html).toContain("Lật xem nghĩa");
      expect(html).toContain("Trộn thứ tự");
      // NO Known action button in Quiz view
      expect(html).not.toContain("Đã biết");
    });
  });
});
