import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { VocabTable, VocabItem } from "../../src/components/learn/VocabTable";
import { VocabQuiz } from "../../src/components/learn/VocabQuiz";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/learn/vocabulary/day/2/list",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F5 — Vocabulary Components", () => {
  const mockVocabItems: VocabItem[] = [
    {
      id: 201,
      kanji: "食べます",
      hiragana: "たべます",
      meaning_vi: "ăn",
      han_viet: "THỰC",
      examples: [
        {
          jp: "パンを食べます。",
          reading: "ぱんをたべます。",
          vi: "Tôi ăn bánh mì.",
        },
      ],
    },
    {
      id: 202,
      kanji: "飲みます",
      hiragana: "のみます",
      meaning_vi: "uống",
      han_viet: "ẨM",
    },
    {
      id: 203,
      kanji: "行きます",
      hiragana: "いきます",
      meaning_vi: "đi",
      han_viet: "HÀNH",
    },
  ];

  describe("VocabTable", () => {
    it("renders vocabulary table with kanji, reading, meaning, and Known action button", () => {
      const html = renderToString(
        <VocabTable
          studyDay={2}
          allItems={mockVocabItems}
          learningSetIds={[201, 202]}
        />
      );

      expect(html).toContain("Vocabulary");
      expect(html).toContain("Ngày");
      expect(html).toContain("食べます");
      expect(html).toContain("たべます");
      expect(html).toContain("ăn");
      expect(html).toContain("THỰC");
      expect(html).toContain("Đã biết");
      expect(html).not.toContain("行きます");
    });

    it("renders replacement item when learning_set_ids contains the replaced item", () => {
      // When backend replaces 201 with 203, learning_set_ids = [202, 203]
      const html = renderToString(
        <VocabTable
          studyDay={2}
          allItems={mockVocabItems}
          learningSetIds={[202, 203]}
        />
      );

      expect(html).toContain("飲みます");
      expect(html).toContain("行きます");
      expect(html).toContain("HÀNH");
      expect(html).not.toContain("食べます");
    });
  });

  describe("VocabQuiz", () => {
    it("renders flashcard with kanji and reading without Known button", () => {
      const html = renderToString(
        <VocabQuiz
          studyDay={2}
          allItems={mockVocabItems}
          learningSetIds={[201, 202]}
        />
      );

      expect(html).toContain("Vocabulary Quiz");
      expect(html).toContain("食べます");
      expect(html).toContain("Lật xem nghĩa");
      expect(html).toContain("Trộn thứ tự");
      // NO Known action button in Quiz view
      expect(html).not.toContain("Đã biết");
    });
  });
});
