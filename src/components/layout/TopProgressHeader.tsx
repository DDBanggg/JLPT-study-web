import React from "react";
import { TargetIcon, ClockIcon } from "../common/Icons";

export interface ProgramDto {
  program_id?: string;
  progress_start_date?: string;
  exam_date?: string;
  projected_day_100_date?: string;
  current_study_day?: number;
  completed_study_days?: number;
  progress_percent?: number;
  days_until_exam?: number;
}

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

export type ProgramHeaderInput = ProgramDto | ProgramProgressData;

export interface TopProgressHeaderProps {
  program?: ProgramHeaderInput | null;
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

function normalizeProgram(program?: ProgramHeaderInput | null) {
  if (!program) return null;
  const p = program as Record<string, unknown>;
  const completedDays = (p.completed_study_days ?? p.completedStudyDays) as number | undefined;
  const rawPercent = (p.progress_percent ?? p.progressPercent) as number | undefined;
  const progressPercent =
    rawPercent !== undefined
      ? rawPercent
      : completedDays !== undefined
        ? Math.min(Math.max(Math.round((completedDays / 100) * 100), 0), 100)
        : 0;
  const daysUntilExam = (p.days_until_exam ?? p.daysUntilExam) as number | undefined;
  const rawExamDate = (p.exam_date ?? p.examDate) as string | undefined;

  return {
    completedDays,
    progressPercent,
    daysUntilExam,
    rawExamDate,
  };
}

export function TopProgressHeader({ program, className = "" }: TopProgressHeaderProps) {
  const normalized = normalizeProgram(program);
  const completedDays = normalized?.completedDays;
  const progressPercent = normalized?.progressPercent ?? 0;
  const daysUntilExam = normalized?.daysUntilExam;
  const examDateDisplay = normalized?.rawExamDate ? formatDateDisplay(normalized.rawExamDate) : null;

  return (
    <header
      className={`w-full border-b border-slate-200 bg-white px-4 py-3 sm:px-8 sm:py-4 transition-colors ${className}`}
      data-testid="top-progress-header"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 sm:gap-6">
        {/* Study Progress Area */}
        <div className="flex min-w-[240px] flex-1 items-center gap-3 sm:gap-4">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <TargetIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500 uppercase tracking-wider text-[11px] sm:text-xs">
                Tiến độ học tập
              </span>
              <span className="font-semibold text-slate-800">
                {completedDays !== undefined ? `${completedDays}` : "—"}{" "}
                <span className="font-normal text-slate-400">/ 100</span>
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 sm:gap-3">
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
              <span className="shrink-0 text-[11px] sm:text-xs font-medium text-slate-600 tabular-nums">
                {`${progressPercent}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Exam Countdown Area */}
        <div className="flex w-full sm:w-auto shrink-0 items-center gap-3 sm:gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 sm:border-slate-200 pt-2 sm:pt-0 sm:pl-6">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">
              Kỳ thi JLPT N3
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg font-semibold text-slate-900 tabular-nums">
                {daysUntilExam !== undefined ? daysUntilExam : "—"}
              </span>
              <span className="text-xs font-medium text-slate-600">ngày còn lại</span>
              {examDateDisplay ? (
                <span className="text-xs text-slate-400">{`(${examDateDisplay})`}</span>
              ) : (
                <span className="text-xs text-slate-400">(—)</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
