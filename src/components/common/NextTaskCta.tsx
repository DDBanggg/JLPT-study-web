import React from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon } from "./Icons";

export interface NextTaskData {
  task_type?: string;
  href?: string;
  label?: string;
}

export interface NextTaskCtaProps {
  nextTask?: NextTaskData | null;
  completionMessage?: string;
  className?: string;
}

export function NextTaskCta({
  nextTask,
  completionMessage = "Bạn đã hoàn thành phần học này!",
  className = "",
}: NextTaskCtaProps) {
  if (!nextTask || !nextTask.href) {
    return (
      <div
        data-testid="next-task-completed-banner"
        className={`flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-800 shadow-2xs ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{completionMessage}</span>
        </div>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <span>Về Schedule</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div
      data-testid="next-task-cta"
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-blue-900 shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <CheckCircleIcon className="h-5 w-5 text-blue-600 shrink-0" />
        <div>
          <div className="text-sm font-semibold">{completionMessage}</div>
          <div className="text-xs text-blue-700/80">Tiếp tục nhiệm vụ tiếp theo trong lộ trình</div>
        </div>
      </div>
      <Link
        href={nextTask.href}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
      >
        <span>{nextTask.label || "Nhiệm vụ tiếp theo"}</span>
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
