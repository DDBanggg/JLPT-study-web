import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  normalizeReadingAnswer,
  ReadingViewer,
  type ReadingItem,
} from "../../src/components/learn/ReadingViewer";

vi.mock("next/navigation", () => ({
  usePathname: () => "/learn/reading/day/2",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

describe("Reading schema v1.2 interactions", () => {
  const item: ReadingItem = {
    id: 201,
    title: "Đọc tổng hợp",
    passage_jp: "田中さんは7時に来ました。",
    translation_vi: "Anh Tanaka đã đến lúc 7 giờ.",
    questions: [
      {
        id: "mcq",
        question_jp: "何時に来ましたか。",
        options: [{ id: "A", text: "7時" }, { id: "B", text: "8時" }],
        correct_option_id: "A",
        explanation_vi: "Bài đọc ghi 7 giờ.",
      },
      {
        id: "tf",
        question_type: "true_false",
        question_jp: "田中さんは7時に来ました。",
        correct_answer: true,
        explanation_vi: "Mệnh đề đúng.",
      },
      {
        id: "short",
        question_type: "short_answer",
        question_jp: "何時ですか。",
        accepted_answers: ["7時", "七時"],
        explanation_vi: "Hai cách viết đều được chấp nhận.",
      },
      {
        id: "matching",
        question_type: "matching",
        question_jp: "人物と持ち物を合わせてください。",
        left_items: [{ id: "L1", text: "田中さん" }, { id: "L2", text: "山田さん" }],
        right_items: [{ id: "R1", text: "本" }, { id: "R2", text: "かばん" }, { id: "R3", text: "傘" }],
        correct_pairs: [{ left_id: "L1", right_id: "R2" }, { left_id: "L2", right_id: "R1" }],
        explanation_vi: "Mỗi người có một đồ vật.",
      },
    ],
  };

  it("compares legacy MCQ, true/false, trimmed short answer, and matching", async () => {
    const user = userEvent.setup();
    render(<ReadingViewer studyDay={2} items={[item]} />);

    const mcq = screen.getByTestId("reading-question-mcq");
    await user.click(within(mcq).getByRole("button", { name: /B.*8時/ }));

    const trueFalse = screen.getByTestId("reading-question-tf");
    await user.click(within(trueFalse).getByRole("button", { name: "Sai" }));

    await user.type(screen.getByRole("textbox", { name: "Câu trả lời cho short" }), "  7時  ");

    const tanakaSelect = screen.getByRole("combobox", { name: "Ghép 田中さん" });
    const yamadaSelect = screen.getByRole("combobox", { name: "Ghép 山田さん" });
    await user.selectOptions(tanakaSelect, "R2");
    expect(within(yamadaSelect).getByRole("option", { name: "かばん" })).toHaveProperty("disabled", true);
    await user.selectOptions(yamadaSelect, "R1");

    await user.click(screen.getByRole("button", { name: "So sánh bản dịch & Đáp án tham khảo" }));

    expect(within(mcq).getByText("Đáp án đúng: A")).toBeDefined();
    expect(within(mcq).getByRole("button", { name: /A.*7時/ }).className).toContain("bg-emerald-50");
    expect(within(mcq).getByRole("button", { name: /B.*8時/ }).className).toContain("bg-red-50");
    expect(within(trueFalse).getByText("Đáp án đúng: Đúng")).toBeDefined();
    expect(within(trueFalse).getByRole("button", { name: "Sai" }).className).toContain("bg-red-50");
    expect(screen.getByTestId("short-result-short").textContent).toContain("Chính xác");
    expect(screen.getByTestId("short-result-short").textContent).toContain("7時 / 七時");
    expect(screen.getByTestId("matching-row-matching-L1").textContent).toContain("田中さん → かばん");
    expect(screen.getByTestId("matching-row-matching-L2").textContent).toContain("山田さん → 本");
  });

  it("normalizes Unicode NFC without fuzzy or case conversion", () => {
    expect(normalizeReadingAnswer("  か\u3099  ")).toBe("が");
    expect(normalizeReadingAnswer("Ａ")).toBe("Ａ");
  });

  it("keeps per-item answers in the session and resets comparison when navigating", async () => {
    const user = userEvent.setup();
    const first = { ...item, questions: [item.questions![2]] };
    const second: ReadingItem = {
      id: 202,
      title: "Bài thứ hai",
      passage_jp: "別の文章。",
      questions: [{
        id: "short",
        question_type: "short_answer",
        question_jp: "答えは？",
        accepted_answers: ["別"],
      }],
    };
    render(<ReadingViewer studyDay={2} items={[first, second]} />);

    const input = screen.getByRole("textbox", { name: "Câu trả lời cho short" });
    await user.type(input, "7時");
    await user.click(screen.getByRole("button", { name: "So sánh bản dịch & Đáp án tham khảo" }));
    expect(screen.getByTestId("short-result-short")).toBeDefined();

    await user.click(screen.getByTitle("Bài tiếp theo"));
    expect(screen.queryByTestId("short-result-short")).toBeNull();
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Câu trả lời cho short" }).value).toBe("");

    await user.click(screen.getByTitle("Bài trước"));
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Câu trả lời cho short" }).value).toBe("7時");
  });

  it("renders fallback dots when questions are null", () => {
    render(<ReadingViewer studyDay={2} items={[{
      id: 202,
      title: "Đoạn văn ngắn",
      passage_jp: "こんにちは。",
      questions: null,
    }]} />);

    expect(screen.getByRole("heading", { name: "Câu hỏi" })).toBeDefined();
    expect(screen.getAllByText("...").length).toBeGreaterThan(0);
  });
});
