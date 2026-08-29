import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("Milestone F6 — Kanji Real Interaction Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

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
      examples: [
        {
          jp: "富士山は高いです。",
          reading: "ふじさんはたかいです。",
          vi: "Núi Phú Sĩ rất cao.",
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
    {
      id: 203,
      kanji: "新",
      han_viet: "TÂN",
      meaning_vi: "mới",
      onyomi: ["シン"],
      kunyomi: ["あたらしい"],
    },
  ];

  it("marks kanji known and updates active set with replacement immediately", async () => {
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
      <KanjiTable
        studyDay={2}
        allItems={mockKanjiItems}
        learningSetIds={[201, 202]}
      />
    );

    // Initial items rendered
    expect(screen.getAllByText("高").length).toBeGreaterThan(0);
    expect(screen.getAllByText("安").length).toBeGreaterThan(0);
    expect(screen.queryByText("新")).toBeNull();

    // Click "Đã biết" for first item
    const knownButtons = screen.getAllByRole("button", { name: "Đã biết" });
    await userEvent.click(knownButtons[0]);

    // Confirmation Modal should open
    await waitFor(() => {
      expect(screen.getByText("Đánh dấu chữ Hán đã biết?")).toBeDefined();
    });

    // Confirm marking known
    const confirmBtn = screen.getByRole("button", { name: "Đã biết & Thay thế" });
    await userEvent.click(confirmBtn);

    // Verify API payload
    await waitFor(() => {
      expect(capturedBody).toEqual({
        item_type: "kanji",
        item_id: 201,
        study_day: 2,
      });
    });

    // Replacement item (203 - 新) should appear immediately
    await waitFor(() => {
      expect(screen.getAllByText("新").length).toBeGreaterThan(0);
      expect(screen.queryByText("CAO")).toBeNull();
    });
  });

  it("renders flashcard and flips to show details and examples", async () => {
    render(
      <KanjiQuiz
        studyDay={2}
        allItems={mockKanjiItems}
        learningSetIds={[201, 202]}
      />
    );

    expect(screen.getByText("高")).toBeDefined();

    // Flip to back
    await userEvent.click(screen.getByRole("button", { name: "Lật xem nghĩa" }));

    await waitFor(() => {
      expect(screen.getByText("CAO")).toBeDefined();
      expect(screen.getByText("cao; đắt")).toBeDefined();
      expect(screen.getByText("Núi Phú Sĩ rất cao.")).toBeDefined();
    });
  });
});
