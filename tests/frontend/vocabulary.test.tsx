import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("Milestone F5 — Vocabulary Real Interaction Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

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
    {
      id: 204,
      surface: "スプーン",
      hiragana: "すぷーん",
      kanji: null,
      meaning_vi: "thìa",
    },
    {
      id: 205,
      surface: "あげます",
      hiragana: "あげます",
      kanji: null,
      meaning_vi: "cho",
    },
    {
      id: 206,
      hiragana: "がっこう",
      kanji: "学校",
      meaning_vi: "trường học",
    },
  ];

  it("marks item known through confirmation modal and replaces active item immediately", async () => {
    let capturedBody: unknown = null;

    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/api/known-items/mark")) {
        capturedBody = JSON.parse(init?.body as string);
        return Promise.resolve({
          status: 200,
          json: async () => ({
            ok: true,
            data: {
              marked_known: 201,
              replacement_item_id: 203,
              learning_set_ids: [202, 203],
              active_count: 2,
              target: 2,
              pool_exhausted: false,
            },
          }),
        } as Response);
      }
      return Promise.resolve({ status: 200, json: async () => ({ ok: true }) } as Response);
    });

    render(
      <VocabTable
        studyDay={2}
        allItems={mockVocabItems}
        learningSetIds={[201, 202]}
      />
    );

    // Initial items rendered
    expect(screen.getAllByText("食べます").length).toBeGreaterThan(0);
    expect(screen.getAllByText("飲みます").length).toBeGreaterThan(0);
    expect(screen.queryByText("行きます")).toBeNull();

    // Click "Đã biết" for first item
    const knownButtons = screen.getAllByRole("button", { name: "Đã biết" });
    await userEvent.click(knownButtons[0]);

    // Confirmation Modal should open
    await waitFor(() => {
      expect(screen.getByText("Đánh dấu từ đã biết?")).toBeDefined();
    });

    // Confirm marking known
    const confirmBtn = screen.getByRole("button", { name: "Đã biết & Thay thế" });
    await userEvent.click(confirmBtn);

    // Verify API called
    await waitFor(() => {
      expect(capturedBody).toEqual({
        item_type: "vocabulary",
        item_id: 201,
        study_day: 2,
      });
    });

    // Replacement item (203 - 行きます) should now appear immediately in the UI
    await waitFor(() => {
      expect(screen.getAllByText("行きます").length).toBeGreaterThan(0);
      expect(screen.queryByText("食べます")).toBeNull();
    });
  });

  it("renders flashcard and flips to show meaning and examples", async () => {
    render(
      <VocabQuiz
        studyDay={2}
        allItems={mockVocabItems}
        learningSetIds={[201, 202]}
      />
    );

    expect(screen.getByText("食べます")).toBeDefined();
    expect(screen.getByRole("button", { name: "Lật xem nghĩa" })).toBeDefined();

    // Click flip button
    await userEvent.click(screen.getByRole("button", { name: "Lật xem nghĩa" }));

    // Back of card shows meaning and examples
    await waitFor(() => {
      expect(screen.getByText("ăn")).toBeDefined();
      expect(screen.getByText("Tôi ăn bánh mì.")).toBeDefined();
      expect(screen.getByRole("button", { name: "Ẩn nghĩa" })).toBeDefined();
    });
  });

  it("uses surface for Katakana in list, flashcard, and Known confirmation", async () => {
    render(<VocabTable studyDay={2} allItems={mockVocabItems} learningSetIds={[204]} />);

    const desktopRow = screen.getByTestId("vocab-row-204");
    expect(within(desktopRow).getByText("スプーン")).toBeDefined();
    expect(within(desktopRow).getByText("すぷーん")).toBeDefined();

    await userEvent.click(screen.getAllByRole("button", { name: "Đã biết" })[0]);
    expect(screen.getByText(/"スプーン"/)).toBeDefined();

    render(<VocabQuiz studyDay={2} allItems={mockVocabItems} learningSetIds={[204]} />);
    const flashcard = screen.getByTestId("vocab-flashcard");
    expect(within(flashcard).getByText("スプーン")).toBeDefined();
    expect(within(flashcard).getByText("すぷーん")).toBeDefined();
  });

  it("does not duplicate a Hiragana-only surface and preserves legacy fallback", () => {
    render(<VocabTable studyDay={2} allItems={mockVocabItems} learningSetIds={[205, 206]} />);

    expect(within(screen.getByTestId("vocab-row-205")).getAllByText("あげます")).toHaveLength(1);
    expect(within(screen.getByTestId("vocab-row-206")).getByText("学校")).toBeDefined();
    expect(within(screen.getByTestId("vocab-row-206")).getByText("がっこう")).toBeDefined();
  });
});
