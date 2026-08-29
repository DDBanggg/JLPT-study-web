import React from "react";
import { TestListView } from "@/components/test/TestListView";

export default function MockTestListPage() {
  return (
    <TestListView
      type="mock"
      title="Test / Mock"
      description="Đề thi thử JLPT N3 hoàn chỉnh mô phỏng kỳ thi chính thức"
    />
  );
}
