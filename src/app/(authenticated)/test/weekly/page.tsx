import React from "react";
import { TestListView } from "@/components/test/TestListView";

export default function WeeklyTestListPage() {
  return (
    <TestListView
      type="weekly"
      title="Weekly Test"
      description="Bài kiểm tra định kỳ hàng tuần theo chuẩn format JLPT N3"
    />
  );
}
