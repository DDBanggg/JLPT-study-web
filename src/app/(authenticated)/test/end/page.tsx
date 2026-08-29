import React from "react";
import { TestListView } from "@/components/test/TestListView";

export default function EndTestListPage() {
  return (
    <TestListView
      type="end"
      title="End Test"
      description="Bài kiểm tra tổng kết giai đoạn lộ trình học"
    />
  );
}
