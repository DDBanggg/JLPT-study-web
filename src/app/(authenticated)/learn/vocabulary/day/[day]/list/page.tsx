"use client";

import React, { useEffect, useState, use } from "react";
import { VocabTable, VocabItem } from "@/components/learn/VocabTable";
import { ContentPending } from "@/components/common/ContentPending";
import { ErrorState } from "@/components/common/ErrorState";

export default function VocabListPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const resolvedParams = use(params);
  const studyDay = Math.max(1, Math.min(100, Number(resolvedParams.day) || 1));

  const [isLoading, setIsLoading] = useState(true);
  const [contentState, setContentState] = useState<"available" | "pending" | null>(null);
  const [items, setItems] = useState<VocabItem[]>([]);
  const [learningSetIds, setLearningSetIds] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadVocab() {
      try {
        // Ensure learning set is created first
        await fetch("/api/learning-sets/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ study_day: studyDay, item_type: "vocabulary" }),
        });

        const res = await fetch(`/api/learn/vocabulary/${studyDay}`);
        const data = await res.json();

        if (res.status === 200 && data?.ok) {
          if (!isMounted) return;
          setContentState(data.data.content_state);
          if (data.data.content_state === "available" && data.data.content?.items) {
            setItems(data.data.content.items);
            setLearningSetIds(data.data.user_state?.learning_set_ids || []);
            setIsCompleted(data.data.user_state?.completed || false);
          }
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;
        setErrorMessage(data?.error?.message || "Không thể tải từ vựng.");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại.");
        setIsLoading(false);
      }
    }

    loadVocab();

    return () => {
      isMounted = false;
    };
  }, [studyDay, retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setRetryCount((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-white border border-slate-200" />
      </div>
    );
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={handleRetry} />;
  }

  if (contentState === "pending" || items.length === 0) {
    return <ContentPending message="Nội dung từ vựng ngày này chưa được chuẩn bị." />;
  }

  return (
    <VocabTable
      studyDay={studyDay}
      allItems={items}
      learningSetIds={learningSetIds}
      isCompletedInitially={isCompleted}
    />
  );
}
