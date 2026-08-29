import React from "react";
import { ClockIcon } from "./Icons";

export interface ContentPendingProps {
  message?: string;
  className?: string;
}

export function ContentPending({
  message = "Nội dung ngày này chưa được chuẩn bị.",
  className = "",
}: ContentPendingProps) {
  return (
    <div
      data-testid="content-pending"
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <ClockIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-700">Đang chuẩn bị nội dung</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{message}</p>
    </div>
  );
}
