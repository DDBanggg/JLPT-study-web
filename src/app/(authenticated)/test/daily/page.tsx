import React from "react";
import { TestListView } from "@/components/test/TestListView";

export default function DailyTestListPage() {
  return (
    <TestListView
      type="daily"
      title="Daily Test"
      description="Bài kiểm tra tổng hợp 45 câu ôn tập kiến thức của ngày trước đó"
    />
  );
}
