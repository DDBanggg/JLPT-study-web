"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ConfirmModal } from "../common/ConfirmModal";
import { NextTaskCta, NextTaskData } from "../common/NextTaskCta";
import { ArrowLeftIcon, LearnIcon } from "../common/Icons";

export interface VocabExample {
  jp: string;
  reading?: string;
  vi: string;
}

export interface VocabItem {
  id: number;
  hiragana: string;
  kanji?: string | null;
  han_viet?: string | null;
  meaning_vi: string;
  examples?: VocabExample[];
  notes_vi?: string[];
}

export interface VocabTableProps {
  studyDay: number;
  allItems: VocabItem[];
  learningSetIds: number[];
  isCompletedInitially?: boolean;
}

export function VocabTable({
  studyDay,
  allItems,
  learningSetIds: initialLearningSetIds,
  isCompletedInitially = false,
}: VocabTableProps) {
  const [activeSetIds, setActiveSetIds] = useState<number[]>(initialLearningSetIds);
  const [isCompleted, setIsCompleted] = useState(isCompletedInitially);
  const [nextTask, setNextTask] = useState<NextTaskData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal state for marking known
  const [itemToMarkKnown, setItemToMarkKnown] = useState<VocabItem | null>(null);
  const [isMarking, setIsMarking] = useState(false);

  const itemMap = new Map(allItems.map((item) => [item.id, item]));
  const activeItems = activeSetIds
    .map((id) => itemMap.get(id))
    .filter((item): item is VocabItem => Boolean(item));

  const handleConfirmMarkKnown = async () => {
    if (!itemToMarkKnown || isMarking) return;
    setIsMarking(true);
    setActionError(null);

    try {
      const res = await fetch("/api/known-items/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_day: studyDay,
          item_type: "vocabulary",
          item_id: itemToMarkKnown.id,
        }),
      });

      const data = await res.json();
      if (res.status === 200 && data?.ok) {
        if (Array.isArray(data?.data?.learning_set)) {
          setActiveSetIds(data.data.learning_set);
        } else {
          setActiveSetIds((prev) => prev.filter((id) => id !== itemToMarkKnown.id));
        }
        setItemToMarkKnown(null);
        return;
      }

      setActionError(data?.error?.message || "Không thể cập nhật từ đã biết.");
      setItemToMarkKnown(null);
    } catch {
      setActionError("Lỗi kết nối máy chủ.");
      setItemToMarkKnown(null);
    } finally {
      setIsMarking(false);
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
              Vocabulary — Ngày {studyDay}
            </h1>
            <p className="text-xs text-slate-500">Danh sách từ vựng trong bộ học hôm nay</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/learn/vocabulary/day/${studyDay}/quiz`}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-100 transition-colors"
          >
            <LearnIcon className="h-4 w-4" />
            <span>Luyện Flashcard / Quiz</span>
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

      {/* Vocabulary Desktop Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5">Từ vựng (Kanji)</th>
                <th className="px-4 py-3.5">Cách đọc (Hiragana)</th>
                <th className="px-4 py-3.5">Hán Việt</th>
                <th className="px-4 py-3.5">Ý nghĩa</th>
                <th className="px-4 py-3.5 text-right w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {activeItems.map((item, index) => (
                <tr
                  key={item.id}
                  data-testid={`vocab-row-${item.id}`}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-3.5 text-center text-slate-400 font-mono">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3.5 text-base font-bold text-slate-900">
                    {item.kanji || item.hiragana}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700 font-mono">
                    {item.hiragana}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-500 uppercase">
                    {item.han_viet || "—"}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    {item.meaning_vi}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setItemToMarkKnown(item)}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 shadow-2xs transition-colors"
                      title="Đánh dấu đã biết để thay thế từ khác"
                    >
                      Đã biết
                    </button>
                  </td>
                </tr>
              ))}
              {activeItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Không có từ vựng nào trong danh sách.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Marking Known */}
      <ConfirmModal
        isOpen={Boolean(itemToMarkKnown)}
        title="Đánh dấu từ đã biết?"
        message={`Bạn có chắc muốn đánh dấu từ "${
          itemToMarkKnown?.kanji || itemToMarkKnown?.hiragana
        }" là đã biết? Từ này sẽ được hệ thống thay thế bằng một từ khác trong kho bài học.`}
        confirmLabel="Đã biết & Thay thế"
        cancelLabel="Hủy"
        onConfirm={handleConfirmMarkKnown}
        onCancel={() => setItemToMarkKnown(null)}
      />
    </div>
  );
}
