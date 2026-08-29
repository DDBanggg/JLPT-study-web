"use client";

import React, { useEffect, useState, useMemo } from "react";
import { CalendarDayModal } from "./CalendarDayModal";
import { ErrorState } from "../common/ErrorState";
import { ChevronLeftIcon, ChevronRightIcon } from "../common/Icons";

export interface CalendarDaySummary {
  date: string;
  study_day: number;
  roadmap_state: "planned" | "pending";
  status: "finished" | "late_finished" | "not_finished" | null;
}

export interface CalendarMonthData {
  month: string;
  program_id: string;
  progress_start_date: string;
  exam_date: string;
  days: CalendarDaySummary[];
}

function getInitialMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getAdjacentMonth(currentMonth: string, offset: number): string {
  const [yearStr, monthStr] = currentMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const date = new Date(year, month - 1 + offset, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function CalendarView() {
  const [month, setMonth] = useState<string>(getInitialMonth());
  const [calendarData, setCalendarData] = useState<CalendarMonthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [selectedStudyDay, setSelectedStudyDay] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCalendar() {
      try {
        const res = await fetch(`/api/calendar?month=${month}`);
        const json = await res.json();

        if (res.status === 200 && json?.ok) {
          if (!isMounted) return;
          setCalendarData(json.data);
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;
        setErrorMessage(json?.error?.message || "Không thể tải dữ liệu lịch học.");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setErrorMessage("Lỗi kết nối máy chủ khi tải Calendar.");
        setIsLoading(false);
      }
    }

    loadCalendar();

    return () => {
      isMounted = false;
    };
  }, [month, retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setRetryCount((prev) => prev + 1);
  };

  const handlePrevMonth = () => {
    setIsLoading(true);
    setMonth((prev) => getAdjacentMonth(prev, -1));
  };

  const handleNextMonth = () => {
    setIsLoading(true);
    setMonth((prev) => getAdjacentMonth(prev, 1));
  };

  const handleTodayMonth = () => {
    const todayMonth = getInitialMonth();
    if (month !== todayMonth) {
      setIsLoading(true);
      setMonth(todayMonth);
    }
  };

  // Build Day mapping for the month
  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDaySummary>();
    if (calendarData?.days) {
      calendarData.days.forEach((day) => {
        map.set(day.date, day);
      });
    }
    return map;
  }, [calendarData]);

  // Generate calendar matrix (weeks x 7 days)
  const calendarCells = useMemo(() => {
    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;

    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // In JS, getDay() returns 0 for Sunday, 1 for Monday...
    // We want Monday = 0, Sunday = 6
    const startDayIndex = (firstDay.getDay() + 6) % 7;

    const cells = [];
    // Leading empty cells
    for (let i = 0; i < startDayIndex; i++) {
      cells.push(null);
    }
    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateIso = `${yearStr}-${monthStr}-${String(d).padStart(2, "0")}`;
      const entry = dayMap.get(dateIso) || null;
      cells.push({ dayNumber: d, dateIso, entry });
    }
    return cells;
  }, [month, dayMap]);

  const monthDisplayTitle = useMemo(() => {
    const [yearStr, monthStr] = month.split("-");
    return `Tháng ${monthStr} / ${yearStr}`;
  }, [month]);

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={handleRetry} />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Lịch học tập (Calendar)
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi trạng thái hoàn thành từng ngày trong lộ trình 100 ngày
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTodayMonth}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            Hôm nay
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors"
              title="Tháng trước"
              aria-label="Tháng trước"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">
              {monthDisplayTitle}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors"
              title="Tháng sau"
              aria-label="Tháng sau"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Legend Bar */}
      <div className="flex flex-wrap items-center gap-5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs text-slate-600 shadow-2xs">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
          Chú thích trạng thái:
        </span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span>Hoàn thành (Green)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span>Hoàn thành muộn (Yellow)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span>Chưa hoàn thành (Red)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-200 border border-slate-300" />
          <span>Chưa đến hạn / Pending</span>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-96 animate-pulse rounded-2xl bg-white border border-slate-200" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold uppercase tracking-wider text-slate-600 py-3">
            {WEEKDAYS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 font-sans">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[100px] bg-slate-50/30 p-2"
                  />
                );
              }

              const { dayNumber, entry } = cell;
              const hasStudyDay = Boolean(entry?.study_day);
              const status = entry?.status;

              let statusColor = "border-transparent bg-white hover:bg-slate-50";
              let badgeColor = "bg-slate-100 text-slate-600";

              if (status === "finished") {
                statusColor = "bg-emerald-50/30 hover:bg-emerald-50/60";
                badgeColor = "bg-emerald-500 text-white font-bold";
              } else if (status === "late_finished") {
                statusColor = "bg-amber-50/30 hover:bg-amber-50/60";
                badgeColor = "bg-amber-400 text-amber-950 font-bold";
              } else if (status === "not_finished") {
                statusColor = "bg-red-50/30 hover:bg-red-50/60";
                badgeColor = "bg-red-500 text-white font-bold";
              }

              return (
                <div
                  key={cell.dateIso}
                  data-testid={`calendar-cell-${cell.dateIso}`}
                  onClick={() => {
                    if (entry?.study_day) {
                      setSelectedStudyDay(entry.study_day);
                    }
                  }}
                  className={`min-h-[100px] p-3 transition-colors ${
                    hasStudyDay ? "cursor-pointer" : "cursor-default"
                  } ${statusColor}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">
                      {dayNumber}
                    </span>
                    {hasStudyDay && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] ${badgeColor}`}
                      >
                        Ngày {entry?.study_day}
                      </span>
                    )}
                  </div>

                  {hasStudyDay && entry?.roadmap_state === "pending" && (
                    <div className="mt-2 text-[10px] text-slate-400 font-medium">
                      Pending
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      <CalendarDayModal
        key={selectedStudyDay}
        studyDay={selectedStudyDay}
        onClose={() => setSelectedStudyDay(null)}
      />
    </div>
  );
}
