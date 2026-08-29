"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GrammarCard, GrammarItem } from "./GrammarCard";
import { NextTaskCta, NextTaskData } from "../common/NextTaskCta";
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon } from "../common/Icons";

export interface GrammarUserState {
  viewed_ids: number[];
  viewed_count: number;
  total_count: number;
  completed: boolean;
}

export interface GrammarViewerProps {
  studyDay: number;
  items: GrammarItem[];
  userState: GrammarUserState;
}

export function GrammarViewer({
  studyDay,
  items,
  userState: initialUserState,
}: GrammarViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedIds, setViewedIds] = useState<Set<number>>(
    new Set(initialUserState.viewed_ids || [])
  );
  const [isCompleted, setIsCompleted] = useState(initialUserState.completed || false);
  const [nextTask, setNextTask] = useState<NextTaskData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const total = items.length;
  const currentItem = items[currentIndex];

  // Helper to mark viewed on backend
  const markViewed = async (grammarId: number) => {
    if (viewedIds.has(grammarId)) return;
    setViewedIds((prev) => new Set([...prev, grammarId]));
    try {
      await fetch("/api/grammar/viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_day: studyDay, grammar_id: grammarId }),
      });
    } catch {
      // Background sync, state is updated optimistically
    }
  };

  const handleNext = () => {
    if (currentItem) {
      markViewed(currentItem.id);
    }
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    if (currentItem) {
      markViewed(currentItem.id);
    }
    setIsCompleting(true);
    setActionError(null);

    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_day: studyDay,
          task_type: "grammar",
          task_id: `grammar_day_${studyDay}`,
        }),
      });
      const data = await res.json();
      if (res.status === 200 && data?.ok) {
        setIsCompleted(true);
        if (data?.data?.next_task) {
          setNextTask(data.data.next_task);
        }
        return;
      }
      setActionError(data?.error?.message || "Không thể lưu trạng thái hoàn thành.");
    } catch {
      setActionError("Lỗi kết nối máy chủ khi hoàn thành.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (!currentItem) {
    return <div className="p-8 text-center text-slate-500">Không có ngữ pháp nào.</div>;
  }

  const isCurrentViewed = viewedIds.has(currentItem.id);
  const isLast = currentIndex === total - 1;

  return (
    <div className="space-y-6">
      {/* Header & Back to Schedule */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/schedule/day/${studyDay}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
            title="Quay lại Schedule"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Grammar — Ngày {studyDay}
            </h1>
            <p className="text-xs text-slate-500">Học ngữ pháp theo lộ trình</p>
          </div>
        </div>

        {/* Progress tracker */}
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 shadow-2xs">
            Đã xem: {viewedIds.size} / {total}
          </span>
          {isCompleted && (
            <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 font-semibold text-emerald-700 shadow-2xs">
              Đã hoàn thành
            </span>
          )}
        </div>
      </div>

      {/* Action Error alert */}
      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          {actionError}
        </div>
      )}

      {/* Completion CTA */}
      {isCompleted && (
        <NextTaskCta
          nextTask={nextTask}
          completionMessage="Bạn đã hoàn thành phần học Grammar hôm nay!"
        />
      )}

      {/* Card */}
      <GrammarCard
        item={currentItem}
        index={currentIndex}
        total={total}
        isViewed={isCurrentViewed}
      />

      {/* Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span>Mẫu trước</span>
        </button>

        <div className="flex items-center gap-3">
          {!isLast ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors"
            >
              <span>Mẫu tiếp theo</span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isCompleting}
              className={`rounded-lg px-5 py-2 text-xs font-semibold shadow-sm transition-colors ${
                isCompleted
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isCompleting
                ? "Đang lưu..."
                : isCompleted
                  ? "Hoàn thành lại"
                  : "Hoàn thành Grammar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
