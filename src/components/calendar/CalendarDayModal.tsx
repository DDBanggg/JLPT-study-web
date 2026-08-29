"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowRightIcon,
  GrammarIcon,
  VocabularyIcon,
  KanjiIcon,
  ReadingIcon,
  ListeningIcon,
  TestIcon,
} from "../common/Icons";

export interface CalendarTaskDto {
  task_id: string;
  task_type: string;
  label: string;
  required: boolean;
  task_state: "finished" | "in_progress" | "pending";
  content_state: "available" | "pending";
  progress: { current: number; total: number } | null;
  href: string;
}

export interface CalendarDayDetailData {
  study_day: number;
  date: string;
  roadmap_state: "planned" | "pending";
  status: "finished" | "late_finished" | "not_finished" | null;
  phase?: string | null;
  title?: string | null;
  tasks?: CalendarTaskDto[];
}

export interface CalendarDayModalProps {
  studyDay: number | null;
  onClose: () => void;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

function getTaskIcon(taskType: string) {
  switch (taskType) {
    case "grammar":
      return <GrammarIcon className="h-4 w-4 text-blue-600" />;
    case "vocabulary":
      return <VocabularyIcon className="h-4 w-4 text-indigo-600" />;
    case "kanji":
      return <KanjiIcon className="h-4 w-4 text-violet-600" />;
    case "reading":
      return <ReadingIcon className="h-4 w-4 text-emerald-600" />;
    case "listening":
      return <ListeningIcon className="h-4 w-4 text-cyan-600" />;
    default:
      return <TestIcon className="h-4 w-4 text-amber-600" />;
  }
}

export function CalendarDayModal({ studyDay, onClose }: CalendarDayModalProps) {
  const [dayData, setDayData] = useState<CalendarDayDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!studyDay) return;
    let isMounted = true;

    fetch(`/api/calendar/day/${studyDay}`)
      .then((res) => res.json().then((json) => ({ status: res.status, json })))
      .then(({ status, json }) => {
        if (!isMounted) return;
        if (status === 200 && json?.ok) {
          setDayData(json.data);
          setError(null);
        } else {
          setError(json?.error?.message || "Không thể tải chi tiết ngày học.");
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studyDay, retryCount]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (studyDay) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [studyDay]);

  useEffect(() => {
    if (!studyDay) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [studyDay, onClose]);

  if (!studyDay) return null;

  const isCurrentDayData = dayData && dayData.study_day === studyDay;
  const isCurrentlyLoading = isLoading || (!isCurrentDayData && !error);

  const renderStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case "finished":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            <span>Hoàn thành đúng hạn</span>
          </span>
        );
      case "late_finished":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            <span>Hoàn thành muộn</span>
          </span>
        );
      case "not_finished":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
            <XCircleIcon className="h-3.5 w-3.5" />
            <span>Chưa hoàn thành</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            <ClockIcon className="h-3.5 w-3.5" />
            <span>Chưa đến hạn / Đang học</span>
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Ngày {studyDay}
              </h3>
              {isCurrentDayData && dayData.date && (
                <span className="text-xs text-slate-500 font-medium">
                  ({formatDate(dayData.date)})
                </span>
              )}
            </div>
            {isCurrentDayData && dayData.title && (
              <p className="text-xs text-slate-500 mt-0.5">{dayData.title}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {isCurrentlyLoading ? (
          <div className="space-y-3 py-6 animate-pulse">
            <div className="h-8 rounded-lg bg-slate-200" />
            <div className="h-16 rounded-xl bg-slate-100" />
            <div className="h-16 rounded-xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setRetryCount((prev) => prev + 1);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : isCurrentDayData ? (
          <div className="space-y-4">
            {/* Status Summary */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Trạng thái ngày học
              </span>
              {renderStatusBadge(dayData.status)}
            </div>

            {/* Task list */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nhiệm vụ trong ngày
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {dayData.tasks && dayData.tasks.length > 0 ? (
                  dayData.tasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                          {getTaskIcon(task.task_type)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{task.label}</div>
                          {task.progress && (
                            <div className="text-[11px] text-slate-400">
                              {task.progress.current} / {task.progress.total}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {task.task_state === "finished" ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Hoàn thành
                          </span>
                        ) : task.task_state === "in_progress" ? (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                            Đang học
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Chưa bắt đầu
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    Chưa có nhiệm vụ cụ thể cho ngày này.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Đóng
          </button>
          <Link
            href={`/schedule/day/${studyDay}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <span>Mở ngày học (Schedule)</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
