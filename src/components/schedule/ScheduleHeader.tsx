import React from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "../common/Icons";

export interface ScheduleHeaderProps {
  studyDay: number;
  totalDays?: number;
  plannedDate?: string;
  currentStudyDay?: number;
  phase?: string | null;
  title?: string | null;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

export function ScheduleHeader({
  studyDay,
  totalDays = 100,
  plannedDate,
  currentStudyDay,
  phase,
  title,
}: ScheduleHeaderProps) {
  const isFirstDay = studyDay <= 1;
  const isLastDay = studyDay >= totalDays;
  const isToday = currentStudyDay !== undefined && studyDay === currentStudyDay;

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Day Navigation */}
        <div className="flex items-center gap-3">
          {isFirstDay ? (
            <button
              type="button"
              disabled
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300 cursor-not-allowed"
              aria-label="Ngày trước đó"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/schedule/day/${studyDay - 1}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
              aria-label="Ngày trước đó"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          )}

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Ngày {studyDay} <span className="text-base font-normal text-slate-400">/ {totalDays}</span>
            </h1>
          </div>

          {isLastDay ? (
            <button
              type="button"
              disabled
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300 cursor-not-allowed"
              aria-label="Ngày tiếp theo"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/schedule/day/${studyDay + 1}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
              aria-label="Ngày tiếp theo"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Date & Today jump */}
        <div className="flex items-center gap-3 text-xs">
          {plannedDate && (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600 shadow-2xs font-medium">
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatDate(plannedDate)}</span>
            </div>
          )}

          {currentStudyDay !== undefined && (
            <Link
              href={`/schedule/day/${currentStudyDay}`}
              className={`rounded-lg px-3 py-2 font-semibold shadow-2xs transition-colors ${
                isToday
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {isToday ? "Hôm nay" : `Về Hôm nay (Ngày ${currentStudyDay})`}
            </Link>
          )}
        </div>
      </div>

      {(phase || title) && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {phase && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 uppercase tracking-wider">
              {phase}
            </span>
          )}
          {title && <span className="font-medium text-slate-700">{title}</span>}
        </div>
      )}
    </div>
  );
}
