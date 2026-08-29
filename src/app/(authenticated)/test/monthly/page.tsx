import React from "react";
import { TestListView } from "@/components/test/TestListView";

export default function MonthlyTestListPage() {
  return (
    <TestListView
      type="monthly"
      title="Monthly Test"
      description="Bài kiểm tra định kỳ hàng tháng đánh giá toàn diện các kỹ năng"
    />
  );
}
