"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NextTaskCta, NextTaskData } from "../common/NextTaskCta";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
} from "../common/Icons";

export interface ReadingQuestionOption {
  id: string;
  text: string;
}

export interface ReadingQuestion {
  id: string;
  question_jp: string;
  options?: ReadingQuestionOption[];
  correct_option_id?: string;
  explanation_vi?: string;
}

export interface ReadingItem {
  id: number;
  title: string;
  passage_jp: string;
  translation_vi?: string;
  questions?: ReadingQuestion[];
}

export interface ReadingViewerProps {
  studyDay: number;
  items: ReadingItem[];
  isCompletedInitially?: boolean;
}

export function ReadingViewer({
  studyDay,
  items,
  isCompletedInitially = false,
}: ReadingViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userDrafts, setUserDrafts] = useState<Record<number, string>>({});
  const [showComparison, setShowComparison] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(isCompletedInitially);
  const [nextTask, setNextTask] = useState<NextTaskData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const total = items.length;
  const currentItem = items[currentIndex];

  const currentDraft = (currentItem ? userDrafts[currentItem.id] : "") || "";

  const handleDraftChange = (text: string) => {
    if (!currentItem) return;
    setUserDrafts((prev) => ({ ...prev, [currentItem.id]: text }));
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleNext = () => {
    setShowComparison(false);
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setShowComparison(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
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
          task_type: "reading",
          task_id: `reading_day_${studyDay}`,
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
    return <div className="p-8 text-center text-slate-500">Không có bài đọc nào.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
              Reading — Ngày {studyDay}
            </h1>
            <p className="text-xs text-slate-500">
              {currentItem.title} {total > 1 ? `(${currentIndex + 1} / ${total})` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {total > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                title="Bài trước"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600">
                {currentIndex + 1} / {total}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === total - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                title="Bài tiếp theo"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}

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
                : "Hoàn thành Reading"}
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
          completionMessage="Bạn đã hoàn thành phần học Reading hôm nay!"
        />
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Japanese Passage */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">{currentItem.title}</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Đoạn văn tiếng Nhật
              </span>
            </div>

            <div
              data-testid="reading-passage"
              className="text-base leading-relaxed text-slate-800 whitespace-pre-line font-sans"
            >
              {currentItem.passage_jp}
            </div>
          </div>

          {/* User Draft Translation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="user-translation-draft"
                className="text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Bản dịch nháp của bạn (tùy chọn)
              </label>
              <span className="text-[11px] text-slate-400">Lưu cục bộ trong phiên học</span>
            </div>
            <textarea
              id="user-translation-draft"
              value={currentDraft}
              onChange={(e) => handleDraftChange(e.target.value)}
              placeholder="Nhập bản dịch nháp tiếng Việt của bạn ở đây trước khi so sánh với đáp án..."
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all resize-y"
            />

            <button
              type="button"
              onClick={() => setShowComparison((prev) => !prev)}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold shadow-2xs transition-colors ${
                showComparison
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
              }`}
            >
              {showComparison ? (
                <>
                  <EyeOffIcon className="h-4 w-4" />
                  <span>Ẩn bản dịch tham khảo & giải thích</span>
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4" />
                  <span>So sánh bản dịch & Đáp án tham khảo</span>
                </>
              )}
            </button>
          </div>

          {/* Reference Translation Card */}
          {showComparison && currentItem.translation_vi && (
            <div
              data-testid="reference-translation-card"
              className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs space-y-2 animate-in fade-in duration-150"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Bản dịch tham khảo
              </div>
              <p className="text-sm leading-relaxed text-emerald-950 whitespace-pre-line">
                {currentItem.translation_vi}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Questions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Câu hỏi</h2>
              <span className="text-xs text-slate-400">
                {currentItem.questions ? `${currentItem.questions.length} câu hỏi` : "..."}
              </span>
            </div>

            {currentItem.questions && currentItem.questions.length > 0 ? (
              <div className="space-y-6">
                {currentItem.questions.map((q, qIndex) => {
                  const selected = selectedAnswers[q.id];
                  const isCorrect = selected === q.correct_option_id;

                  return (
                    <div
                      key={q.id || qIndex}
                      data-testid={`reading-question-${q.id || qIndex}`}
                      className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <div className="text-sm font-semibold text-slate-900 leading-snug">
                        <span className="text-blue-600 font-bold mr-1.5">Câu {qIndex + 1}:</span>
                        {q.question_jp}
                      </div>

                      {/* Options */}
                      {q.options && (
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt) => {
                            const isOptionSelected = selected === opt.id;
                            const isOptionCorrect = showComparison && opt.id === q.correct_option_id;
                            const isOptionWrong =
                              showComparison && isOptionSelected && !isCorrect;

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectOption(q.id, opt.id)}
                                className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2 text-left text-xs font-medium transition-colors ${
                                  isOptionCorrect
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold"
                                    : isOptionWrong
                                      ? "border-red-300 bg-red-50 text-red-900"
                                      : isOptionSelected
                                        ? "border-blue-500 bg-blue-50/80 text-blue-900 font-semibold"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                                    {opt.id}
                                  </span>
                                  <span>{opt.text}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation (when comparison active) */}
                      {showComparison && q.explanation_vi && (
                        <div className="mt-2 rounded-lg bg-white border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
                          <div className="font-semibold text-slate-800">
                            Đáp án đúng: {q.correct_option_id}
                          </div>
                          <div>{q.explanation_vi}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 font-mono text-sm">...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
