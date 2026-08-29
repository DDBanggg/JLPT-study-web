import React from "react";
import { TestListView } from "@/components/test/TestListView";

export default function DailyTestListPage() {
  return (
    <TestListView
      type="daily"
      title="Daily Test"
      description="Bài kiểm tra tổng hợp 45 câu (Ngữ pháp, Từ vựng, Chữ Hán) ôn tập ngày trước đó"
    />
  );
}
