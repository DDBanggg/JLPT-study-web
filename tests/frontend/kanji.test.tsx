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

  it("marks kanji known and removes only the confirmed item", async () => {
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
        learningSetIds={[201, 202, 203]}
      />
    );

    // Initial items rendered
    expect(screen.getByTestId("kanji-row-201")).toBeDefined();
    expect(screen.getByTestId("kanji-row-202")).toBeDefined();
    expect(screen.getByTestId("kanji-row-203")).toBeDefined();

    // Click "Đã biết" for first item
    const knownButtons = screen.getAllByRole("button", { name: "Đã biết" });
    await userEvent.click(knownButtons[0]);

    // Confirmation Modal should open
    await waitFor(() => {
      expect(screen.getByText("Đánh dấu chữ Hán đã biết?")).toBeDefined();
    });
    const dialogText = screen.getByRole("dialog").textContent ?? "";
    expect(dialogText).toContain(
      'Bạn có chắc muốn đánh dấu chữ Hán "高" (CAO) là đã biết? Chữ này sẽ được loại khỏi danh sách cần học.'
    );
    expect(dialogText).not.toMatch(/thay thế|replacement|reserve|kho bài học|kho dự phòng|duy trì 30/i);

    // Confirm marking known
    const confirmBtn = screen.getByRole("button", { name: "Đánh dấu đã biết" });
    await userEvent.click(confirmBtn);

    // Verify API payload
    await waitFor(() => {
      expect(capturedBody).toEqual({
        item_type: "kanji",
        item_id: 201,
        study_day: 2,
      });
    });

    // Only the confirmed item is removed; existing active items preserve their order.
    await waitFor(() => {
      expect(screen.queryByTestId("kanji-row-201")).toBeNull();
      expect(screen.getByTestId("kanji-row-202")).toBeDefined();
      expect(screen.getByTestId("kanji-row-203")).toBeDefined();
      expect(screen.queryAllByTestId(/^kanji-row-/)).toHaveLength(2);
    });
  });

  it("shows the empty state when the final active Kanji is marked known", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ ok: true, data: { marked_known: 201 } }),
    } as Response);

    render(<KanjiTable studyDay={2} allItems={mockKanjiItems} learningSetIds={[201]} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Đã biết" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "Đánh dấu đã biết" }));

    await waitFor(() => {
      expect(screen.queryByTestId("kanji-row-201")).toBeNull();
      expect(screen.getAllByText("Không có chữ Hán nào trong danh sách.").length).toBeGreaterThan(0);
    });
  });

  it("rejects a successful response without a valid marked_known id", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ ok: true, data: {} }),
    } as Response);

    render(<KanjiTable studyDay={2} allItems={mockKanjiItems} learningSetIds={[201, 202]} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Đã biết" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "Đánh dấu đã biết" }));

    await waitFor(() => {
      expect(screen.getByTestId("kanji-row-201")).toBeDefined();
      expect(screen.getByRole("alert").textContent).toContain(
        "Phản hồi máy chủ không hợp lệ khi cập nhật chữ Hán đã biết."
      );
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

  it("uses the dynamic active-item count for a 33-item Kanji quiz", () => {
    const thirtyThreeItems: KanjiItem[] = Array.from({ length: 33 }, (_, index) => ({
      id: 1000 + index,
      kanji: String.fromCodePoint(0x4e00 + index),
      han_viet: `KANJI ${index + 1}`,
      meaning_vi: `Nghĩa ${index + 1}`,
    }));

    render(
      <KanjiQuiz
        studyDay={2}
        allItems={thirtyThreeItems}
        learningSetIds={thirtyThreeItems.map((item) => item.id)}
      />
    );

    expect(screen.getByText("1 / 33")).toBeDefined();
  });
});
