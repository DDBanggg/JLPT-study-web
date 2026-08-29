"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NextTaskCta, NextTaskData } from "../common/NextTaskCta";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ListeningIcon,
} from "../common/Icons";

export interface ListeningYoutubeInfo {
  type?: "video" | "playlist" | string;
  video_id?: string | null;
  playlist_id?: string | null;
}

export interface ListeningItem {
  id: number;
  title: string;
  description_vi?: string;
  youtube?: ListeningYoutubeInfo;
  fallback_url?: string;
}

export interface ListeningViewerProps {
  studyDay: number;
  items: ListeningItem[];
  isCompletedInitially?: boolean;
}

export function ListeningViewer({
  studyDay,
  items,
  isCompletedInitially = false,
}: ListeningViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(isCompletedInitially);
  const [nextTask, setNextTask] = useState<NextTaskData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const total = items.length;
  const currentItem = items[currentIndex];

  const handleNext = () => {
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
    setIsCompleting(true);
    setActionError(null);

    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_day: studyDay,
          task_type: "listening",
          task_id: `listening_day_${studyDay}`,
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
    return <div className="p-8 text-center text-slate-500">Không có bài nghe nào.</div>;
  }

  // Construct embed URL
  let embedUrl: string | null = null;
  if (currentItem.youtube?.video_id) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${currentItem.youtube.video_id}?rel=0`;
  } else if (currentItem.youtube?.playlist_id) {
    embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${currentItem.youtube.playlist_id}`;
  }

  const fallbackUrl =
    currentItem.fallback_url ||
    (currentItem.youtube?.video_id
      ? `https://www.youtube.com/watch?v=${currentItem.youtube.video_id}`
      : "https://www.youtube.com");

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
              Listening — Ngày {studyDay}
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
                : "Hoàn thành Listening"}
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
          completionMessage="Bạn đã hoàn thành phần học Listening hôm nay!"
        />
      )}

      {/* Embedded YouTube Player */}
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-md">
          <div className="relative aspect-video w-full">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={currentItem.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-white">
                <ListeningIcon className="h-10 w-10 text-slate-400 mb-3" />
                <p className="text-sm font-semibold">Video không thể phát trực tiếp trên trang.</p>
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Mở trên YouTube
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Video metadata & Fallback Link */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">{currentItem.title}</h2>
            {currentItem.description_vi && (
              <p className="text-xs text-slate-600">{currentItem.description_vi}</p>
            )}
          </div>

          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="youtube-fallback-link"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span>Mở trên YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );
}
