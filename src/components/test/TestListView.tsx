"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ContentPending } from "../common/ContentPending";
import { ErrorState } from "../common/ErrorState";
import {
  TestIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from "../common/Icons";

export interface TestResultData {
  test_id: string;
  test_type: string;
  score: number | null;
  max_score: number | null;
  language_score?: number | null;
  reading_score?: number | null;
  listening_score?: number | null;
  total_score?: number | null;
  completed_at?: string;
}

export interface TestListItem {
  test_id: string;
  test_type: string;
  study_day: number;
  label: string;
  content_state: "available" | "pending";
  title: string | null;
  coverage: { from_day: number; to_day: number } | null;
  latest_result: TestResultData | null;
  href: string;
}

export interface TestListData {
  type: string;
  roadmap_state?: "planned" | "pending";
  tests: TestListItem[];
}

export interface TestListViewProps {
  type: "grammar" | "daily" | "weekly" | "monthly" | "end" | "mock";
  title: string;
  description: string;
}

export function TestListView({ type, title, description }: TestListViewProps) {
  const [data, setData] = useState<TestListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadTests() {
      try {
        const res = await fetch(`/api/tests?type=${type}`);
        const json = await res.json();

        if (res.status === 200 && json?.ok) {
          if (!isMounted) return;
          setData(json.data);
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;
        setErrorMessage(json?.error?.message || "Không thể tải danh sách bài thi.");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại.");
        setIsLoading(false);
      }
    }

    loadTests();

    return () => {
      isMounted = false;
    };
  }, [type, retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setRetryCount((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-white border border-slate-200" />
          <div className="h-24 animate-pulse rounded-xl bg-white border border-slate-200" />
          <div className="h-24 animate-pulse rounded-xl bg-white border border-slate-200" />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={handleRetry} />;
  }

  if (!data || data.roadmap_state === "pending" || data.tests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <ContentPending message="Danh sách bài thi chưa được chuẩn bị." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
          Tổng số bài: {data.tests.length}
        </div>
      </div>

      {/* Test List Cards */}
      <div className="space-y-3">
        {data.tests.map((test) => {
          const isPending = test.content_state === "pending";
          const hasResult = Boolean(test.latest_result);
          const result = test.latest_result;

          // Format score display
          let scoreText: string | null = null;
          if (result) {
            if (result.score !== null && result.max_score !== null) {
              scoreText = `${result.score} / ${result.max_score}`;
            } else if (result.total_score !== null) {
              scoreText = `${result.total_score} / 180`;
            }
          }

          return (
            <div
              key={test.test_id}
              data-testid={`test-card-${test.test_id}`}
              className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5 shadow-2xs transition-all ${
                isPending
                  ? "border-slate-200/60 bg-slate-50/40 opacity-70"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <TestIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 truncate">
                      {test.title || test.label}
                    </h2>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Ngày {test.study_day}
                    </span>
                  </div>

                  {test.coverage && (
                    <div className="text-xs text-slate-500">
                      Phạm vi: Ngày {test.coverage.from_day} → Ngày {test.coverage.to_day}
                    </div>
                  )}
                </div>
              </div>

              {/* Status / Score & CTA */}
              <div className="flex items-center gap-4 shrink-0">
                {isPending ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                    <ClockIcon className="h-3.5 w-3.5" />
                    <span>Chưa có đề</span>
                  </span>
                ) : hasResult ? (
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      <span>Đã làm: {scoreText}</span>
                    </span>

                    <Link
                      href={test.href}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                      <span>Làm lại</span>
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={test.href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <span>Làm bài</span>
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
