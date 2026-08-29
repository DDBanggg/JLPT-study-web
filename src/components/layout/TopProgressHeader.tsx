import React from "react";
import { TargetIcon, ClockIcon } from "../common/Icons";

export interface ProgramProgressData {
  programId?: string;
  progressStartDate?: string;
  examDate?: string;
  projectedDay100Date?: string;
  currentStudyDay?: number;
  completedStudyDays?: number;
  progressPercent?: number;
  daysUntilExam?: number;
}

export interface TopProgressHeaderProps {
  program?: ProgramProgressData | null;
  className?: string;
}

function formatDateDisplay(isoDate?: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

export function TopProgressHeader({ program, className = "" }: TopProgressHeaderProps) {
  const currentDay = program?.currentStudyDay ?? 1;
  const completedDays = program?.completedStudyDays ?? 0;
  const progressPercent = program?.progressPercent ?? Math.round((completedDays / 100) * 100);
  const daysUntilExam = program?.daysUntilExam ?? 100;
  const examDateDisplay = program?.examDate ? formatDateDisplay(program.examDate) : "06/12/2026";

  return (
    <header
      className={`w-full border-b border-slate-200 bg-white px-8 py-4 transition-colors ${className}`}
      data-testid="top-progress-header"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
        {/* Study Progress Area */}
        <div className="flex min-w-[280px] flex-1 items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <TargetIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500 uppercase tracking-wider">
                Tiến độ học tập
              </span>
              <span className="font-semibold text-slate-800">
                {`Ngày ${currentDay}`} <span className="font-normal text-slate-400">/ 100</span>
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span className="shrink-0 text-xs font-medium text-slate-600 tabular-nums">
                {`${progressPercent}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Exam Countdown Area */}
        <div className="flex shrink-0 items-center gap-4 border-l border-slate-200 pl-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <ClockIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Kỳ thi JLPT N3
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-lg font-semibold text-slate-900 tabular-nums">
                {daysUntilExam}
              </span>
              <span className="text-xs font-medium text-slate-600">ngày còn lại</span>
              {examDateDisplay && (
                <span className="text-xs text-slate-400">{`(${examDateDisplay})`}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
