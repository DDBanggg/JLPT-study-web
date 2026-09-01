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

const legacyItem: ReadingItem = {
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
      right_items: [{ id: "R1", text: "本" }, { id: "R2", text: "かばん" }],
      correct_pairs: [{ left_id: "L1", right_id: "R2" }, { left_id: "L2", right_id: "R1" }],
      explanation_vi: "Mỗi người có một đồ vật.",
    },
  ],
};

const visualItem: ReadingItem = {
  id: 202,
  title: "Bài đọc bằng hình",
  passage_jp: null,
  translation_vi: null,
  media: [
    { id: "map", type: "image", src: "/reading/assets/map.png", alt: "Bản đồ nhà ga" },
    { id: "chart", type: "image", src: "/reading/assets/chart.webp" },
  ],
  questions: [{
    id: "visual-mcq",
    question_jp: "正しいものはどれですか。",
    options: [{ id: "A", text: "A" }, { id: "B", text: "B" }],
    correct_option_id: "A",
  }],
};

const imageQuestionItem: ReadingItem = {
  id: 203,
  title: "Câu hỏi bằng hình",
  passage_jp: "絵を見て答えてください。",
  media: [{ id: "prompt", type: "image", src: "/reading/assets/prompt.jpg" }],
  questions: [
    {
      id: "image-mcq",
      question_jp: "正しい絵はどれですか。",
      options: [
        { id: "A", image_src: "/reading/assets/options/a.png" },
        { id: "B", text: "選択肢B", image_src: "/reading/assets/options/b.jpg" },
      ],
      correct_option_id: "A",
    },
    {
      id: "image-matching",
      question_type: "matching",
      question_jp: "組み合わせてください。",
      left_items: [
        { id: "L1", image_src: "/reading/assets/people/tanaka.png" },
        { id: "L2", text: "山田" },
      ],
      right_items: [
        { id: "R1", text: "本" },
        { id: "R2", image_src: "/reading/assets/objects/bag.webp" },
      ],
      correct_pairs: [
        { left_id: "L1", right_id: "R2" },
        { left_id: "L2", right_id: "R1" },
      ],
    },
  ],
};

describe("Reading schema v1.4 interactions", () => {
  it("renders a legacy text-only Reading item", () => {
    render(<ReadingViewer studyDay={2} items={[{
      id: 204,
      title: "Đoạn văn cũ",
      passage_jp: "こんにちは。",
      questions: [],
    }]} />);

    expect(screen.getByTestId("reading-passage").textContent).toBe("こんにちは。");
    expect(screen.getByRole("textbox", { name: "Bản dịch nháp của bạn (tùy chọn)" })).toBeDefined();
    expect(screen.queryByTestId("reading-media")).toBeNull();
  });

  it("reveals a text translation without revealing answers", async () => {
    const user = userEvent.setup();
    render(<ReadingViewer studyDay={2} items={[legacyItem]} />);

    await user.click(screen.getByRole("button", { name: "So sánh bản dịch" }));

    expect(screen.getByTestId("reference-translation-card").textContent).toContain(
      "Anh Tanaka đã đến lúc 7 giờ.",
    );
    expect(screen.queryByText("Đáp án đúng: A")).toBeNull();
    expect(screen.getByRole("button", { name: "Kiểm tra đáp án" })).toBeDefined();
  });

  it("renders visual-only media in array order with responsive, neutral fallback alt", () => {
    render(<ReadingViewer studyDay={2} items={[visualItem]} />);

    const images = within(screen.getByTestId("reading-media")).getAllByRole("img");
    expect(images.map((image) => image.getAttribute("src"))).toEqual([
      "/reading/assets/map.png",
      "/reading/assets/chart.webp",
    ]);
    expect(images[0].getAttribute("alt")).toBe("Bản đồ nhà ga");
    expect(images[1].getAttribute("alt")).toBe("Hình minh họa của bài đọc");
    expect(images[0].className).toContain("h-auto");
    expect(images[0].className).toContain("max-w-full");
  });

  it("hides all passage and translation UI for visual-only Reading", () => {
    render(<ReadingViewer studyDay={2} items={[visualItem]} />);

    expect(screen.queryByTestId("reading-passage")).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Bản dịch nháp của bạn (tùy chọn)" })).toBeNull();
    expect(screen.queryByRole("button", { name: "So sánh bản dịch" })).toBeNull();
    expect(screen.queryByTestId("reference-translation-card")).toBeNull();
  });

  it("checks visual-only questions independently of translation", async () => {
    const user = userEvent.setup();
    render(<ReadingViewer studyDay={2} items={[visualItem]} />);

    const question = screen.getByTestId("reading-question-visual-mcq");
    await user.click(within(question).getByRole("button", { name: "AA" }));
    await user.click(screen.getByRole("button", { name: "Kiểm tra đáp án" }));

    expect(within(question).getByText("Đáp án đúng: A")).toBeDefined();
    expect(screen.queryByTestId("reference-translation-card")).toBeNull();
  });

  it("renders passage and media together for mixed Reading", () => {
    render(<ReadingViewer studyDay={2} items={[imageQuestionItem]} />);

    expect(screen.getByTestId("reading-passage").textContent).toContain("絵を見て");
    expect(within(screen.getByTestId("reading-media")).getByRole("img").getAttribute("src"))
      .toBe("/reading/assets/prompt.jpg");
    expect(screen.getByRole("textbox", { name: "Bản dịch nháp của bạn (tùy chọn)" })).toBeDefined();
  });

  it("selects an MCQ image option with a neutral image alt", async () => {
    const user = userEvent.setup();
    render(<ReadingViewer studyDay={2} items={[imageQuestionItem]} />);

    const option = screen.getByTestId("mcq-option-image-mcq-A");
    expect(within(option).getByRole("img").getAttribute("alt")).toBe("Hình minh họa của lựa chọn");
    await user.click(option);

    expect(option.className).toContain("border-blue-500");
  });

  it("shows correct and wrong states for image MCQ options", async () => {
    const user = userEvent.setup();
    render(<ReadingViewer studyDay={2} items={[imageQuestionItem]} />);

    const correct = screen.getByTestId("mcq-option-image-mcq-A");
    const wrong = screen.getByTestId("mcq-option-image-mcq-B");
    await user.click(wrong);
    await user.click(screen.getByRole("button", { name: "Kiểm tra đáp án" }));

    expect(correct.className).toContain("bg-emerald-50");
    expect(wrong.className).toContain("bg-red-50");
  });

  it("assigns and grades image matching items with candidate cards", async () => {
    const user = userEvent.setup();
    render(<ReadingViewer studyDay={2} items={[imageQuestionItem]} />);

    const leftImage = within(screen.getByTestId("matching-row-image-matching-L1"))
      .getAllByRole("img")
      .find((image) => image.getAttribute("src") === "/reading/assets/people/tanaka.png");
    expect(leftImage).toBeDefined();
    expect(leftImage?.getAttribute("alt")).toBe("Hình minh họa của lựa chọn");

    await user.click(screen.getByTestId("matching-candidate-image-matching-L1-R2"));
    await user.click(screen.getByTestId("matching-candidate-image-matching-L2-R1"));
    await user.click(screen.getByRole("button", { name: "Kiểm tra đáp án" }));

    expect(screen.getByTestId("matching-row-image-matching-L1").className).toContain("bg-emerald-50");
    expect(screen.getByTestId("matching-row-image-matching-L2").className).toContain("bg-emerald-50");
  });

  it("prevents reusing a right matching candidate and replaces a left assignment", async () => {
    const user = userEvent.setup();
    render(<ReadingViewer studyDay={2} items={[imageQuestionItem]} />);

    const leftOneRightTwo = screen.getByTestId("matching-candidate-image-matching-L1-R2");
    const leftTwoRightTwo = screen.getByTestId<HTMLButtonElement>("matching-candidate-image-matching-L2-R2");
    await user.click(leftOneRightTwo);
    expect(leftTwoRightTwo.disabled).toBe(true);

    await user.click(screen.getByTestId("matching-candidate-image-matching-L1-R1"));
    expect(leftTwoRightTwo.disabled).toBe(false);
    expect(screen.getByTestId("matching-candidate-image-matching-L2-R1")).toHaveProperty("disabled", true);
  });

  it("keeps short-answer NFC plus trim normalization", async () => {
    const user = userEvent.setup();
    const item: ReadingItem = {
      id: 205,
      title: "Chuẩn hóa",
      passage_jp: "答えてください。",
      questions: [{
        id: "normalized-short",
        question_type: "short_answer",
        question_jp: "答えは？",
        accepted_answers: ["が"],
      }],
    };
    render(<ReadingViewer studyDay={2} items={[item]} />);

    await user.type(screen.getByRole("textbox", { name: "Câu trả lời cho normalized-short" }), "  か\u3099  ");
    await user.click(screen.getByRole("button", { name: "Kiểm tra đáp án" }));

    expect(screen.getByTestId("short-result-normalized-short").textContent).toContain("Chính xác");
    expect(normalizeReadingAnswer("  か\u3099  ")).toBe("が");
    expect(normalizeReadingAnswer("Ａ")).toBe("Ａ");
  });

  it("keeps existing text MCQ, true/false, short-answer, and matching behavior", async () => {
    const user = userEvent.setup();
    render(<ReadingViewer studyDay={2} items={[legacyItem]} />);

    const mcq = screen.getByTestId("reading-question-mcq");
    await user.click(within(mcq).getByRole("button", { name: /B.*8時/ }));
    const trueFalse = screen.getByTestId("reading-question-tf");
    await user.click(within(trueFalse).getByRole("button", { name: "Sai" }));
    await user.type(screen.getByRole("textbox", { name: "Câu trả lời cho short" }), "  7時  ");
    await user.click(screen.getByTestId("matching-candidate-matching-L1-R2"));
    await user.click(screen.getByTestId("matching-candidate-matching-L2-R1"));
    await user.click(screen.getByRole("button", { name: "Kiểm tra đáp án" }));

    expect(screen.getByTestId("mcq-option-mcq-A").className).toContain("bg-emerald-50");
    expect(screen.getByTestId("mcq-option-mcq-B").className).toContain("bg-red-50");
    expect(within(trueFalse).getByRole("button", { name: "Sai" }).className).toContain("bg-red-50");
    expect(screen.getByTestId("short-result-short").textContent).toContain("Chính xác");
    expect(screen.getByTestId("matching-row-matching-L1").textContent).toContain("かばん");
    expect(screen.getByText("Bài đọc ghi 7 giờ.")).toBeDefined();
    expect(screen.queryByTestId("reference-translation-card")).toBeNull();
  });

  it("keeps per-item answers and resets translation and answer reveals when navigating", async () => {
    const user = userEvent.setup();
    const first = { ...legacyItem, questions: [legacyItem.questions![2]] };
    const second: ReadingItem = {
      id: 206,
      title: "Bài thứ hai",
      passage_jp: "別の文章。",
      translation_vi: "Đoạn văn khác.",
      questions: [{
        id: "short",
        question_type: "short_answer",
        question_jp: "答えは？",
        accepted_answers: ["別"],
      }],
    };
    render(<ReadingViewer studyDay={2} items={[first, second]} />);

    await user.type(screen.getByRole("textbox", { name: "Câu trả lời cho short" }), "7時");
    await user.click(screen.getByRole("button", { name: "So sánh bản dịch" }));
    await user.click(screen.getByRole("button", { name: "Kiểm tra đáp án" }));
    expect(screen.getByTestId("reference-translation-card")).toBeDefined();
    expect(screen.getByTestId("short-result-short")).toBeDefined();

    await user.click(screen.getByTitle("Bài tiếp theo"));
    expect(screen.queryByTestId("reference-translation-card")).toBeNull();
    expect(screen.queryByTestId("short-result-short")).toBeNull();
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Câu trả lời cho short" }).value).toBe("");

    await user.click(screen.getByTitle("Bài trước"));
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Câu trả lời cho short" }).value).toBe("7時");
    expect(screen.getByRole("button", { name: "So sánh bản dịch" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Kiểm tra đáp án" })).toBeDefined();
  });

  it("renders fallback dots when questions are null", () => {
    render(<ReadingViewer studyDay={2} items={[{
      id: 207,
      title: "Đoạn văn ngắn",
      passage_jp: "こんにちは。",
      questions: null,
    }]} />);

    expect(screen.getByRole("heading", { name: "Câu hỏi" })).toBeDefined();
    expect(screen.getAllByText("...").length).toBeGreaterThan(0);
  });
});
