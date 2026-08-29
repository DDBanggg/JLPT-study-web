import React from "react";
import { AlertTriangleIcon } from "./Icons";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Không thể tải dữ liệu",
  message = "Đã xảy ra lỗi khi tải dữ liệu từ máy chủ.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      data-testid="error-state"
      className={`rounded-2xl border border-red-200 bg-red-50/40 p-8 text-center max-w-md mx-auto my-6 shadow-2xs ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangleIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-red-800">{title}</h3>
      <p className="mt-1 text-xs text-red-600 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
