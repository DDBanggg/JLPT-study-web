"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { getVocabDisplay, getVocabReading, VocabItem } from "./VocabTable";
import { NextTaskCta, NextTaskData } from "../common/NextTaskCta";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ShuffleIcon,
  LearnIcon,
} from "../common/Icons";

export interface VocabQuizProps {
  studyDay: number;
  allItems: VocabItem[];
  learningSetIds: number[];
  isCompletedInitially?: boolean;
}

export function VocabQuiz({
  studyDay,
  allItems,
  learningSetIds,
  isCompletedInitially = false,
}: VocabQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[] | null>(null);
  const [isCompleted, setIsCompleted] = useState(isCompletedInitially);
  const [nextTask, setNextTask] = useState<NextTaskData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const itemMap = useMemo(
    () => new Map(allItems.map((item) => [item.id, item])),
    [allItems]
  );

  const baseItems = useMemo(
    () =>
      learningSetIds
        .map((id) => itemMap.get(id))
        .filter((item): item is VocabItem => Boolean(item)),
    [learningSetIds, itemMap]
  );

  const items = useMemo(() => {
    if (!shuffledIndices) return baseItems;
    return shuffledIndices.map((i) => baseItems[i]).filter((item): item is VocabItem => Boolean(item));
  }, [baseItems, shuffledIndices]);

  const total = items.length;
  const currentItem = items[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleToggleShuffle = () => {
    if (shuffledIndices) {
      setShuffledIndices(null);
    } else {
      const indices = baseItems.map((_, idx) => idx);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setActionError(null);

    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_day: studyDay,
          task_type: "vocabulary",
          task_id: `vocabulary_day_${studyDay}`,
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
    return <div className="p-8 text-center text-slate-500">Không có từ vựng nào để luyện tập.</div>;
  }

  const isShuffledActive = Boolean(shuffledIndices);
  const display = getVocabDisplay(currentItem);
  const reading = getVocabReading(currentItem);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/learn/vocabulary/day/${studyDay}/list`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
            title="Quay lại Danh sách"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Vocabulary Quiz / Flashcard — Ngày {studyDay}
            </h1>
            <p className="text-xs text-slate-500">Luyện tập ghi nhớ từ vựng</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleShuffle}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-2xs transition-colors ${
              isShuffledActive
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ShuffleIcon className="h-3.5 w-3.5" />
            <span>Trộn thứ tự: {isShuffledActive ? "BẬT" : "TẮT"}</span>
          </button>

          <Link
            href={`/learn/vocabulary/day/${studyDay}/list`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <LearnIcon className="h-3.5 w-3.5" />
            <span>Xem bảng danh sách</span>
          </Link>

          <button
            type="button"
            onClick={handleComplete}
            disabled={isCompleting}
            className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
              isCompleted
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isCompleting
              ? "Đang lưu..."
              : isCompleted
                ? "Hoàn thành lại"
                : "Hoàn thành Vocabulary"}
          </button>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          {actionError}
        </div>
      )}

      {isCompleted && (
        <NextTaskCta
          nextTask={nextTask}
          completionMessage="Bạn đã hoàn thành phần học Vocabulary hôm nay!"
        />
      )}

      {/* Flashcard Component */}
      <div
        data-testid="vocab-flashcard"
        onClick={() => setIsFlipped((prev) => !prev)}
        className="relative mx-auto flex min-h-[320px] max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm hover:border-blue-300 transition-all select-none"
      >
        <div className="absolute top-4 right-4 text-xs font-medium text-slate-400">
          {currentIndex + 1} / {total}
        </div>

        {!isFlipped ? (
          /* Front Side: Kanji + Hiragana */
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="text-4xl font-bold text-slate-900 tracking-tight font-sans">
              {display}
            </div>
            {reading && (
              <div className="text-lg font-medium text-slate-500 font-mono">
                {reading}
              </div>
            )}
            <div className="pt-4 text-xs text-slate-400">
              Nhấn vào thẻ hoặc nút bên dưới để xem nghĩa
            </div>
          </div>
        ) : (
          /* Back Side: Meaning + Han Viet + Examples */
          <div className="w-full space-y-4 animate-in fade-in duration-150 text-left">
            <div className="border-b border-slate-100 pb-3 text-center">
              <div className="text-2xl font-bold text-slate-900">
                {display}
              </div>
              {(reading || currentItem.han_viet) && (
                <div className="text-sm font-medium text-blue-600 font-mono">
                  {reading ?? ""} {currentItem.han_viet ? `(${currentItem.han_viet})` : ""}
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-xs uppercase font-semibold text-slate-400 mb-0.5">Ý nghĩa</div>
              <div className="text-lg font-semibold text-slate-800">{currentItem.meaning_vi}</div>
            </div>

            {currentItem.examples && currentItem.examples.length > 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  Ví dụ
                </div>
                {currentItem.examples.map((ex, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="font-medium text-slate-900">{ex.jp}</div>
                    <div className="text-slate-500">{ex.vi}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors order-1"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span>Từ trước</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFlipped((prev) => !prev)}
          className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-4 sm:px-5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors order-3 w-full sm:w-auto sm:order-2"
        >
          {isFlipped ? "Ẩn nghĩa" : "Lật xem nghĩa"}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === total - 1}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors order-2 sm:order-3"
        >
          <span>Từ tiếp theo</span>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
