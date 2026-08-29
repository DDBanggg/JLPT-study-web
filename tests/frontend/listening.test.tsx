import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ListeningViewer, ListeningItem } from "../../src/components/learn/ListeningViewer";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/learn/listening/day/2",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Milestone F8 — Listening Components", () => {
  const mockListeningItems: ListeningItem[] = [
    {
      id: 201,
      title: "Listening — Lesson 6",
      description_vi: "Bài nghe tương ứng Lesson 6. Nghe và nắm nội dung chính.",
      youtube: {
        type: "video",
        video_id: "Bkmu-tmwGvA",
      },
      fallback_url: "https://www.youtube.com/watch?v=Bkmu-tmwGvA",
    },
    {
      id: 202,
      title: "Listening — Lesson 7",
      description_vi: "Bài nghe tương ứng Lesson 7.",
      youtube: {
        type: "video",
        video_id: "ooYQEVmoboI",
      },
      fallback_url: "https://www.youtube.com/watch?v=ooYQEVmoboI",
    },
  ];

  it("renders 16:9 YouTube embed, description, and fallback link", () => {
    const html = renderToString(
      <ListeningViewer studyDay={2} items={mockListeningItems} />
    );

    expect(html).toContain("Listening");
    expect(html).toContain("Ngày");
    expect(html).toContain("Listening — Lesson 6");
    expect(html).toContain("https://www.youtube-nocookie.com/embed/Bkmu-tmwGvA");
    expect(html).toContain("Mở trên YouTube");
    expect(html).toContain('href="https://www.youtube.com/watch?v=Bkmu-tmwGvA"');
    expect(html).toContain("Hoàn thành Listening");
  });

  it("renders fallback link without iframe when video_id is not available", () => {
    const itemWithoutVideo: ListeningItem = {
      id: 203,
      title: "Audio Unit 8",
      fallback_url: "https://www.youtube.com/playlist?list=sample",
    };

    const html = renderToString(
      <ListeningViewer studyDay={2} items={[itemWithoutVideo]} />
    );

    expect(html).toContain("Audio Unit 8");
    expect(html).toContain("Mở trên YouTube");
  });
});
