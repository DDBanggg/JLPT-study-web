import React from "react";
import { TestEngine } from "@/components/test/TestEngine";

export default async function EndTestTakingPage({
  params,
}: {
  params: Promise<{ test_id: string }>;
}) {
  const { test_id } = await params;
  return <TestEngine testId={test_id} />;
}
