"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ConfirmModal } from "../common/ConfirmModal";
import { NextTaskCta, NextTaskData } from "../common/NextTaskCta";
import { ContentPending } from "../common/ContentPending";
import { ErrorState } from "../common/ErrorState";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "../common/Icons";

export interface TestOption {
  id: string;
  text: string;
}

export interface TestQuestion {
  id: string;
  category: string;
  prompt: string;
  options: TestOption[];
}

export interface TestSection {
  id: string;
  title: string;
  max_score: number;
  questions: TestQuestion[];
}

export interface TestDocumentData {
  schema_version: number;
  id: string;
  type: string;
  title: string;
  study_day: number;
  coverage?: { from_day: number; to_day: number };
  sections: TestSection[];
}

export interface TestReviewItem {
  question_id: string;
  selected_option_id: string | null;
  correct_option_id: string;
  correct: boolean;
  explanation_vi: string;
}

export interface TestResultScore {
  test_id: string;
  test_type: string;
  score: number | null;
  max_score: number | null;
  language_score: number | null;
  reading_score: number | null;
  listening_score: number | null;
  total_score: number | null;
}

export interface TestEngineProps {
  testId: string;
}

export function TestEngine({ testId }: TestEngineProps) {
  const [testDoc, setTestDoc] = useState<TestDocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // User selections: question_id -> option_id
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Post-submit review state
  const [resultScore, setResultScore] = useState<TestResultScore | null>(null);
  const [reviewItems, setReviewItems] = useState<TestReviewItem[] | null>(null);
  const [nextTask, setNextTask] = useState<NextTaskData | null>(null);

  // Fetch test document on mount
  useEffect(() => {
    let isMounted = true;

    async function loadTest() {
      try {
        const res = await fetch(`/api/tests/${testId}`);
        const data = await res.json();

        if (res.status === 200 && data?.ok) {
          if (!isMounted) return;
          setTestDoc(data.data);
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;
        setErrorMessage(data?.error?.message || "Không thể tải đề thi.");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setErrorMessage("Lỗi kết nối máy chủ khi tải đề thi.");
        setIsLoading(false);
      }
    }

    loadTest();

    return () => {
      isMounted = false;
    };
  }, [testId, retryCount]);

  const allQuestions = useMemo(() => {
    if (!testDoc?.sections) return [];
    return testDoc.sections.flatMap((sec) => sec.questions);
  }, [testDoc]);

  const reviewMap = useMemo(() => {
    if (!reviewItems) return new Map<string, TestReviewItem>();
    return new Map(reviewItems.map((item) => [item.question_id, item]));
  }, [reviewItems]);

  const totalQuestions = allQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (resultScore) return; // Locked in review mode
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleScrollToQuestion = (questionId: string) => {
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const performSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setShowUnansweredModal(false);

    try {
      const payload = {
        answers: allQuestions.map((q) => ({
          question_id: q.id,
          option_id: answers[q.id] || null,
        })),
      };

      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status === 200 && data?.ok) {
        setResultScore(data.data.result);
        setReviewItems(data.data.review);
        if (data.data.next_task) {
          setNextTask(data.data.next_task);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSubmitError(data?.error?.message || "Không thể nộp bài thi.");
    } catch {
      setSubmitError("Lỗi kết nối khi nộp bài thi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (unansweredCount > 0) {
      setShowUnansweredModal(true);
    } else {
      performSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="h-96 animate-pulse rounded-2xl bg-white border border-slate-200 lg:col-span-3" />
          <div className="h-64 animate-pulse rounded-2xl bg-white border border-slate-200" />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => {
          setIsLoading(true);
          setErrorMessage(null);
          setRetryCount((prev) => prev + 1);
        }}
      />
    );
  }

  if (!testDoc || allQuestions.length === 0) {
    return <ContentPending message="Đề thi chưa có câu hỏi." />;
  }

  const isReviewMode = Boolean(resultScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/schedule/day/${testDoc.study_day}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
            title="Quay lại Schedule"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {testDoc.title}
            </h1>
            <p className="text-xs text-slate-500">
              Ngày {testDoc.study_day} • Tổng số: {totalQuestions} câu hỏi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isReviewMode ? (
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Đang nộp bài..." : "Nộp bài thi"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setResultScore(null);
                setReviewItems(null);
                setAnswers({});
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              Làm lại bài thi
            </button>
          )}
        </div>
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          {submitError}
        </div>
      )}

      {/* Review Mode Banner & Score Display */}
      {isReviewMode && resultScore && (
        <div className="space-y-4">
          <div
            data-testid="test-result-banner"
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-emerald-950 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Kết quả bài thi</h2>
                <p className="text-xs text-emerald-800">
                  Xem lại chi tiết đáp án và phần giải thích bên dưới
                </p>
              </div>
            </div>

            {/* Score details */}
            <div className="flex items-center gap-4">
              {resultScore.score !== null && resultScore.max_score !== null ? (
                <div className="text-center rounded-xl bg-white border border-emerald-100 px-5 py-2.5 shadow-2xs">
                  <div className="text-xs font-medium text-slate-500 uppercase">Điểm số</div>
                  <div className="text-2xl font-black text-emerald-700">
                    {resultScore.score}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      / {resultScore.max_score}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-center rounded-xl bg-white border border-slate-100 p-2.5 shadow-2xs">
                    <div className="text-[10px] text-slate-400 uppercase">Ngôn ngữ</div>
                    <div className="text-sm font-bold text-slate-800">
                      {resultScore.language_score ?? "—"} / 60
                    </div>
                  </div>
                  <div className="text-center rounded-xl bg-white border border-slate-100 p-2.5 shadow-2xs">
                    <div className="text-[10px] text-slate-400 uppercase">Đọc hiểu</div>
                    <div className="text-sm font-bold text-slate-800">
                      {resultScore.reading_score ?? "—"} / 60
                    </div>
                  </div>
                  <div className="text-center rounded-xl bg-white border border-slate-100 p-2.5 shadow-2xs">
                    <div className="text-[10px] text-slate-400 uppercase">Nghe hiểu</div>
                    <div className="text-sm font-bold text-slate-800">
                      {resultScore.listening_score ?? "—"} / 60
                    </div>
                  </div>
                  <div className="text-center rounded-xl bg-emerald-600 text-white px-4 py-2.5 shadow-2xs">
                    <div className="text-[10px] uppercase font-semibold text-emerald-100">Tổng điểm</div>
                    <div className="text-lg font-black">{resultScore.total_score ?? "—"} / 180</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <NextTaskCta
            nextTask={nextTask}
            completionMessage="Hoàn thành bài thi! Bạn có thể tiếp tục lộ trình học."
          />
        </div>
      )}

      {/* Main Grid: Questions Left, Sticky Navigator Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Questions List (3 Cols) */}
        <div className="space-y-8 lg:col-span-3">
          {testDoc.sections.map((section, sIndex) => (
            <div key={section.id || sIndex} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-base font-bold text-slate-800">{section.title}</h3>
                <span className="text-xs text-slate-400">
                  {section.questions.length} câu hỏi • Điểm tối đa: {section.max_score}
                </span>
              </div>

              <div className="space-y-4">
                {section.questions.map((q) => {
                  const globalIdx = allQuestions.findIndex((item) => item.id === q.id) + 1;
                  const selectedOpt = answers[q.id];
                  const review = reviewMap.get(q.id);

                  return (
                    <div
                      key={q.id}
                      id={`question-${q.id}`}
                      data-testid={`question-card-${q.id}`}
                      className={`rounded-2xl border bg-white p-6 shadow-xs transition-all space-y-4 ${
                        isReviewMode && review
                          ? review.correct
                            ? "border-emerald-300 bg-emerald-50/20"
                            : "border-red-300 bg-red-50/20"
                          : "border-slate-200"
                      }`}
                    >
                      {/* Prompt */}
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700 font-mono">
                          {globalIdx}
                        </span>
                        <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                          {q.prompt}
                        </div>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1">
                        {q.options.map((opt) => {
                          const isSelected = selectedOpt === opt.id;
                          const isCorrect = isReviewMode && review && opt.id === review.correct_option_id;
                          const isWrong =
                            isReviewMode && review && isSelected && !review.correct;

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectOption(q.id, opt.id)}
                              disabled={isReviewMode}
                              className={`flex items-center gap-3 rounded-xl border p-3 text-left text-xs font-medium transition-all ${
                                isCorrect
                                  ? "border-emerald-400 bg-emerald-50 text-emerald-950 font-bold"
                                  : isWrong
                                    ? "border-red-400 bg-red-50 text-red-950"
                                    : isSelected
                                      ? "border-blue-500 bg-blue-50/80 text-blue-900 font-semibold ring-2 ring-blue-100"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                  isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : isWrong
                                      ? "bg-red-600 text-white"
                                      : isSelected
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span>{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Review Details */}
                      {isReviewMode && review && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-700 space-y-1 mt-3">
                          <div className="flex items-center gap-2">
                            {review.correct ? (
                              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                <CheckCircleIcon className="h-4 w-4" /> Chính xác
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-semibold text-red-600">
                                <XCircleIcon className="h-4 w-4" /> Chưa chính xác
                              </span>
                            )}
                            <span className="text-slate-400">•</span>
                            <span>Đáp án đúng: <strong>{review.correct_option_id}</strong></span>
                          </div>
                          {review.explanation_vi && (
                            <p className="text-slate-600 leading-relaxed pt-1">
                              {review.explanation_vi}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Question Navigator (1 Col) */}
        <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Danh sách câu
            </h4>
            <span className="text-xs font-medium text-slate-500">
              {answeredCount} / {totalQuestions} đã làm
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {allQuestions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const review = reviewMap.get(q.id);

              let buttonStyle = "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200";
              if (isReviewMode && review) {
                buttonStyle = review.correct
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                  : "bg-red-100 text-red-800 border-red-300 font-bold";
              } else if (isAnswered) {
                buttonStyle = "bg-blue-50 text-blue-700 border-blue-300 font-bold";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleScrollToQuestion(q.id)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-all ${buttonStyle}`}
                  title={`Câu ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {!isReviewMode && (
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Đang nộp bài..." : "Nộp bài thi"}
            </button>
          )}
        </div>
      </div>

      {/* Unanswered Questions Warning Modal */}
      <ConfirmModal
        isOpen={showUnansweredModal}
        title="Nộp bài khi chưa hoàn thành?"
        message={`Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài thi ngay bây giờ không?`}
        confirmLabel="Vẫn nộp bài"
        cancelLabel="Tiếp tục làm bài"
        onConfirm={performSubmit}
        onCancel={() => setShowUnansweredModal(false)}
        isDestructive={false}
      />
    </div>
  );
}
