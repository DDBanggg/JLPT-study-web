"use client";

import React, { useEffect, useState } from "react";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { ErrorState } from "@/components/common/ErrorState";

export default function SchedulePage() {
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadProgram() {
      try {
        const res = await fetch("/api/program");
        const json = await res.json();

        if (res.status === 200 && json?.ok && json?.data?.program?.current_study_day) {
          if (isMounted) {
            setCurrentDay(json.data.program.current_study_day);
            setErrorMessage(null);
          }
          return;
        }

        if (isMounted) {
          setErrorMessage(json?.error?.message || "Không thể tải thông tin chương trình học.");
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Lỗi kết nối máy chủ khi tải chương trình học.");
        }
      }
    }

    loadProgram();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  if (errorMessage) {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => {
          setErrorMessage(null);
          setRetryCount((prev) => prev + 1);
        }}
      />
    );
  }

  if (currentDay === null) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-white border border-slate-200" />
          <div className="h-20 animate-pulse rounded-xl bg-white border border-slate-200" />
        </div>
      </div>
    );
  }

  return <ScheduleView day={currentDay} />;
}
