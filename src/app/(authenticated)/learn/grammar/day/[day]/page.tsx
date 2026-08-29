"use client";

import React, { useEffect, useState, use } from "react";
import { GrammarViewer, GrammarUserState } from "@/components/learn/GrammarViewer";
import { GrammarItem } from "@/components/learn/GrammarCard";
import { ContentPending } from "@/components/common/ContentPending";
import { ErrorState } from "@/components/common/ErrorState";

export default function GrammarDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const resolvedParams = use(params);
  const studyDay = Math.max(1, Math.min(100, Number(resolvedParams.day) || 1));

  const [isLoading, setIsLoading] = useState(true);
  const [contentState, setContentState] = useState<"available" | "pending" | null>(null);
  const [items, setItems] = useState<GrammarItem[]>([]);
  const [userState, setUserState] = useState<GrammarUserState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadGrammar() {
      try {
        const res = await fetch(`/api/learn/grammar/${studyDay}`);
        const data = await res.json();

        if (res.status === 200 && data?.ok) {
          if (!isMounted) return;
          setContentState(data.data.content_state);
          if (data.data.content_state === "available" && data.data.content?.items) {
            setItems(data.data.content.items);
            setUserState(data.data.user_state);
          }
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;
        setErrorMessage(data?.error?.message || "Không thể tải nội dung ngữ pháp.");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại.");
        setIsLoading(false);
      }
    }

    loadGrammar();

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
    return <ContentPending message="Nội dung ngữ pháp ngày này chưa được chuẩn bị." />;
  }

  return (
    <GrammarViewer
      studyDay={studyDay}
      items={items}
      userState={
        userState || {
          viewed_ids: [],
          viewed_count: 0,
          total_count: items.length,
          completed: false,
        }
      }
    />
  );
}
