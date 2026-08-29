import React from "react";
import { TestListView } from "@/components/test/TestListView";

export default function GrammarTestListPage() {
  return (
    <TestListView
      type="grammar"
      title="Grammar Test"
      description="Bài kiểm tra ngữ pháp 25 câu cho từng ngày học"
    />
  );
}
