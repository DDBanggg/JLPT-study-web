import React from "react";
import Link from "next/link";
import {
  GrammarIcon,
  VocabularyIcon,
  KanjiIcon,
  ReadingIcon,
  ListeningIcon,
  TestIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
} from "../common/Icons";

export interface TaskProgress {
  current: number;
  total: number;
}

export interface ScheduleTask {
  task_id: string;
  task_type: string;
  label: string;
  order: number;
  required: boolean;
  content_state: "available" | "pending";
  task_state: "pending" | "in_progress" | "finished";
  progress: TaskProgress | null;
  href: string;
}

export interface TaskCardProps {
  task: ScheduleTask;
}

function getTaskIcon(taskType: string) {
  switch (taskType) {
    case "grammar":
      return <GrammarIcon className="h-5 w-5 text-blue-600" />;
    case "vocabulary":
      return <VocabularyIcon className="h-5 w-5 text-indigo-600" />;
    case "kanji":
      return <KanjiIcon className="h-5 w-5 text-violet-600" />;
    case "reading":
      return <ReadingIcon className="h-5 w-5 text-emerald-600" />;
    case "listening":
      return <ListeningIcon className="h-5 w-5 text-cyan-600" />;
    default:
      return <TestIcon className="h-5 w-5 text-amber-600" />;
  }
}

export function TaskCard({ task }: TaskCardProps) {
  const isContentPending = task.content_state === "pending";
  const isFinished = task.task_state === "finished";
  const isInProgress = task.task_state === "in_progress";

  const statusBadge = () => {
    if (isContentPending) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <ClockIcon className="h-3 w-3" />
          <span>Chưa có nội dung</span>
        </span>
      );
    }
    if (isFinished) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircleIcon className="h-3 w-3" />
          <span>Hoàn thành</span>
        </span>
      );
    }
    if (isInProgress) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
          Đang học
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        Chưa bắt đầu
      </span>
    );
  };

  return (
    <Link
      href={task.href}
      data-testid={`task-card-${task.task_id}`}
      className={`group relative flex items-center justify-between rounded-xl border bg-white p-5 shadow-2xs transition-all duration-150 hover:shadow-xs hover:border-blue-300 ${
        isFinished
          ? "border-slate-200/80 bg-slate-50/40"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isFinished
              ? "bg-emerald-50"
              : isContentPending
                ? "bg-amber-50"
                : "bg-slate-100 group-hover:bg-blue-50"
          }`}
        >
          {getTaskIcon(task.task_type)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors truncate">
              {task.label}
            </h3>
            {task.required && (
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                Bắt buộc
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            {task.progress ? (
              <span className="font-semibold text-slate-700 tabular-nums">
                {task.progress.current} <span className="font-normal text-slate-400">/ {task.progress.total}</span>
              </span>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {statusBadge()}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
