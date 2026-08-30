"use client";

import React, { useState } from "react";
import Link from "next/link";

import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, EyeOffIcon } from "../common/Icons";
import { NextTaskCta, type NextTaskData } from "../common/NextTaskCta";

export type ReadingQuestionType = "mcq" | "true_false" | "short_answer" | "matching";

export interface ReadingQuestionOption {
  id: string;
  text: string;
}

type ReadingQuestionBase = {
  id: string;
  question_jp: string;
  explanation_vi?: string;
};

export type ReadingMcqQuestion = ReadingQuestionBase & {
  question_type?: "mcq";
  options: ReadingQuestionOption[];
  correct_option_id: string;
};

export type ReadingTrueFalseQuestion = ReadingQuestionBase & {
  question_type: "true_false";
  correct_answer: boolean;
};

export type ReadingShortAnswerQuestion = ReadingQuestionBase & {
  question_type: "short_answer";
  accepted_answers: string[];
};

export type ReadingMatchingQuestion = ReadingQuestionBase & {
  question_type: "matching";
  left_items: ReadingQuestionOption[];
  right_items: ReadingQuestionOption[];
  correct_pairs: Array<{ left_id: string; right_id: string }>;
};

export type ReadingQuestion = ReadingMcqQuestion | ReadingTrueFalseQuestion | ReadingShortAnswerQuestion | ReadingMatchingQuestion;

export interface ReadingItem {
  id: number;
  title: string;
  passage_jp: string;
  translation_vi?: string;
  questions?: ReadingQuestion[] | null;
}

export interface ReadingViewerProps {
  studyDay: number;
  items: ReadingItem[];
  isCompletedInitially?: boolean;
}

export function normalizeReadingAnswer(value: string): string {
  return value.normalize("NFC").trim();
}

function resultClass(correct: boolean): string {
  return correct
    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
    : "border-red-300 bg-red-50 text-red-900";
}

export function ReadingViewer({ studyDay, items, isCompletedInitially = false }: ReadingViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userDrafts, setUserDrafts] = useState<Record<number, string>>({});
  const [showComparison, setShowComparison] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [trueFalseAnswers, setTrueFalseAnswers] = useState<Record<string, boolean>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, Record<string, string>>>({});
  const [isCompleted, setIsCompleted] = useState(isCompletedInitially);
  const [nextTask, setNextTask] = useState<NextTaskData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const total = items.length;
  const currentItem = items[currentIndex];
  const currentDraft = (currentItem ? userDrafts[currentItem.id] : "") || "";

  const changeItem = (offset: number) => {
    setShowComparison(false);
    setCurrentIndex((previous) => previous + offset);
  };

  const assignMatch = (questionId: string, leftId: string, rightId: string) => {
    setMatchingAnswers((previous) => {
      const next = { ...(previous[questionId] ?? {}) };
      for (const [assignedLeftId, assignedRightId] of Object.entries(next)) {
        if (assignedLeftId !== leftId && assignedRightId === rightId) delete next[assignedLeftId];
      }
      if (rightId) next[leftId] = rightId;
      else delete next[leftId];
      return { ...previous, [questionId]: next };
    });
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setActionError(null);
    try {
      const response = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_day: studyDay, task_type: "reading", task_id: `reading_day_${studyDay}` }),
      });
      const payload = await response.json();
      if (response.status === 200 && payload?.ok) {
        setIsCompleted(true);
        if (payload?.data?.next_task) setNextTask(payload.data.next_task);
        return;
      }
      setActionError(payload?.error?.message || "Không thể lưu trạng thái hoàn thành.");
    } catch {
      setActionError("Lỗi kết nối máy chủ khi hoàn thành.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (!currentItem) return <div className="p-8 text-center text-slate-500">Không có bài đọc nào.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href={`/schedule/day/${studyDay}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs" title="Quay lại Schedule">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Reading — Ngày {studyDay}</h1>
            <p className="text-xs text-slate-500">{currentItem.title} {total > 1 ? `(${currentIndex + 1} / ${total})` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {total > 1 && (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => changeItem(-1)} disabled={currentIndex === 0} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40" title="Bài trước"><ChevronLeftIcon className="h-4 w-4" /></button>
              <span className="text-xs font-semibold text-slate-600">{currentIndex + 1} / {total}</span>
              <button type="button" onClick={() => changeItem(1)} disabled={currentIndex === total - 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40" title="Bài tiếp theo"><ChevronRightIcon className="h-4 w-4" /></button>
            </div>
          )}
          <button type="button" onClick={handleComplete} disabled={isCompleting} className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm ${isCompleted ? "bg-emerald-600" : "bg-blue-600"}`}>
            {isCompleting ? "Đang lưu..." : isCompleted ? "Hoàn thành lại" : "Hoàn thành Reading"}
          </button>
        </div>
      </div>

      {actionError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{actionError}</div>}
      {isCompleted && <NextTaskCta nextTask={nextTask} completionMessage="Bạn đã hoàn thành phần học Reading hôm nay!" />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">{currentItem.title}</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Đoạn văn tiếng Nhật</span>
            </div>
            <div data-testid="reading-passage" className="whitespace-pre-line text-base leading-relaxed text-slate-800">{currentItem.passage_jp}</div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <label htmlFor="user-translation-draft" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Bản dịch nháp của bạn (tùy chọn)</label>
            <textarea id="user-translation-draft" value={currentDraft} onChange={(event) => setUserDrafts((previous) => ({ ...previous, [currentItem.id]: event.target.value }))} rows={4} className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50/50 p-3 text-xs text-slate-800" />
            <button type="button" onClick={() => setShowComparison((previous) => !previous)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2 text-xs font-semibold text-blue-700">
              {showComparison ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              <span>{showComparison ? "Ẩn bản dịch tham khảo & giải thích" : "So sánh bản dịch & Đáp án tham khảo"}</span>
            </button>
          </div>

          {showComparison && currentItem.translation_vi && (
            <div data-testid="reference-translation-card" className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Bản dịch tham khảo</div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-emerald-950">{currentItem.translation_vi}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Câu hỏi</h2>
              <span className="text-xs text-slate-400">{currentItem.questions ? `${currentItem.questions.length} câu hỏi` : "..."}</span>
            </div>

            {currentItem.questions && currentItem.questions.length > 0 ? (
              <div className="space-y-6">
                {currentItem.questions.map((question, index) => {
                  const questionType = question.question_type ?? "mcq";
                  const answerKey = `${currentItem.id}:${question.id}`;
                  return (
                    <div key={question.id} data-testid={`reading-question-${question.id}`} className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="text-sm font-semibold leading-snug text-slate-900"><span className="mr-1.5 font-bold text-blue-600">Câu {index + 1}:</span>{question.question_jp}</div>

                      {questionType === "mcq" && "options" in question && (
                        <div className="space-y-2 pt-1">
                          {question.options.map((option) => {
                            const selected = mcqAnswers[answerKey];
                            const selectedOption = selected === option.id;
                            const correctOption = showComparison && option.id === question.correct_option_id;
                            const wrongOption = showComparison && selectedOption && selected !== question.correct_option_id;
                            return <button key={option.id} type="button" onClick={() => setMcqAnswers((previous) => ({ ...previous, [answerKey]: option.id }))} className={`flex w-full items-center gap-2.5 rounded-lg border px-3.5 py-2 text-left text-xs font-medium ${correctOption ? "border-emerald-300 bg-emerald-50 text-emerald-900" : wrongOption ? "border-red-300 bg-red-50 text-red-900" : selectedOption ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"}`}><span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold">{option.id}</span><span>{option.text}</span></button>;
                          })}
                          {showComparison && <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600"><div className="font-semibold text-slate-800">Đáp án đúng: {question.correct_option_id}</div>{question.explanation_vi && <div>{question.explanation_vi}</div>}</div>}
                        </div>
                      )}

                      {questionType === "true_false" && "correct_answer" in question && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {[true, false].map((answer) => {
                              const selected = trueFalseAnswers[answerKey] === answer;
                              const stateClass = showComparison && selected ? resultClass(answer === question.correct_answer) : "border-slate-200 bg-white text-slate-700";
                              return <button key={String(answer)} type="button" onClick={() => setTrueFalseAnswers((previous) => ({ ...previous, [answerKey]: answer }))} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${selected && !showComparison ? "border-blue-500 bg-blue-50 text-blue-900" : stateClass}`}>{answer ? "Đúng" : "Sai"}</button>;
                            })}
                          </div>
                          {showComparison && <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600"><div className="font-semibold text-slate-800">Đáp án đúng: {question.correct_answer ? "Đúng" : "Sai"}</div>{question.explanation_vi && <div>{question.explanation_vi}</div>}</div>}
                        </div>
                      )}

                      {questionType === "short_answer" && "accepted_answers" in question && (() => {
                        const answer = shortAnswers[answerKey] ?? "";
                        const normalized = normalizeReadingAnswer(answer);
                        const correct = normalized.length > 0 && question.accepted_answers.some((candidate) => normalizeReadingAnswer(candidate) === normalized);
                        return <div className="space-y-2"><input aria-label={`Câu trả lời cho ${question.id}`} value={answer} onChange={(event) => setShortAnswers((previous) => ({ ...previous, [answerKey]: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />{showComparison && <div data-testid={`short-result-${question.id}`} className={`rounded-lg border p-3 text-xs ${resultClass(correct)}`}><div className="font-semibold">{correct ? "Chính xác" : "Chưa chính xác"}</div><div>Đáp án chấp nhận: {question.accepted_answers.join(" / ")}</div>{question.explanation_vi && <div>{question.explanation_vi}</div>}</div>}</div>;
                      })()}

                      {questionType === "matching" && "left_items" in question && (
                        <div className="space-y-3">
                          {question.left_items.map((leftItem) => {
                            const assignments = matchingAnswers[answerKey] ?? {};
                            const selectedRightId = assignments[leftItem.id] ?? "";
                            const correctRightId = question.correct_pairs.find((pair) => pair.left_id === leftItem.id)?.right_id ?? "";
                            const correctRight = question.right_items.find((item) => item.id === correctRightId);
                            return (
                              <div key={leftItem.id} data-testid={`matching-row-${question.id}-${leftItem.id}`} className={`grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr] ${showComparison ? resultClass(selectedRightId === correctRightId) : "border-slate-200 bg-white"}`}>
                                <label htmlFor={`${question.id}-${leftItem.id}`} className="text-xs font-semibold text-slate-800">{leftItem.text}</label>
                                <select id={`${question.id}-${leftItem.id}`} aria-label={`Ghép ${leftItem.text}`} value={selectedRightId} onChange={(event) => assignMatch(answerKey, leftItem.id, event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800">
                                  <option value="">Chọn đáp án</option>
                                  {question.right_items.map((rightItem) => {
                                    const usedByAnother = Object.entries(assignments).some(([assignedLeft, assignedRight]) => assignedLeft !== leftItem.id && assignedRight === rightItem.id);
                                    return <option key={rightItem.id} value={rightItem.id} disabled={usedByAnother}>{rightItem.text}</option>;
                                  })}
                                </select>
                                {showComparison && <div className="text-xs sm:col-span-2">Đáp án đúng: {leftItem.text} → {correctRight?.text}</div>}
                              </div>
                            );
                          })}
                          {showComparison && question.explanation_vi && <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">{question.explanation_vi}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : <div className="py-8 text-center font-mono text-sm text-slate-400">...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
