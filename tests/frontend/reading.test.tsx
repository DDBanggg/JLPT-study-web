import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ReadingViewer, ReadingItem } from "../../src/components/learn/ReadingViewer";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/learn/reading/day/2",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F7 — Reading Components", () => {
  const mockReadingItem: ReadingItem = {
    id: 201,
    title: "お花見",
    passage_jp: "お花見を しましょう\n奈良の 吉野山へ 行きませんか。",
    translation_vi: "Hãy đi ngắm hoa. Bạn có muốn đi núi Yoshino ở Nara không?",
    questions: [
      {
        id: "q1",
        question_jp: "何をしますか。",
        options: [
          { id: "A", text: "お花見" },
          { id: "B", text: "買い物" },
        ],
        correct_option_id: "A",
        explanation_vi: "Thông báo nói sẽ đi ngắm hoa.",
      },
    ],
  };

  it("renders Japanese passage, questions, user translation draft area, and compare button", () => {
    const html = renderToString(
      <ReadingViewer studyDay={2} items={[mockReadingItem]} />
    );

    expect(html).toContain("Reading");
    expect(html).toContain("Ngày");
    expect(html).toContain("お花見");
    expect(html).toContain("奈良の 吉野山へ 行きませんか。");
    expect(html).toContain("Bản dịch nháp của bạn");
    expect(html).toContain("So sánh bản dịch &amp; Đáp án tham khảo");
    expect(html).toContain("何をしますか。");
    expect(html).toContain("Hoàn thành Reading");
  });

  it("renders fallback dots when item has no questions", () => {
    const itemWithoutQuestions: ReadingItem = {
      id: 202,
      title: "Đoạn văn ngắn",
      passage_jp: "こんにちは。",
    };

    const html = renderToString(
      <ReadingViewer studyDay={2} items={[itemWithoutQuestions]} />
    );

    expect(html).toContain("...");
  });
});
