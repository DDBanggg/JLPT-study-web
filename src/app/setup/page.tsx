"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, TargetIcon, CalendarIcon, ClockIcon } from "@/components/common/Icons";

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function computeProjectedDay100(startDateIso: string): string {
  if (!startDateIso || !/^\d{4}-\d{2}-\d{2}$/.test(startDateIso)) return "";
  const parts = startDateIso.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 99);
  return date.toISOString().slice(0, 10);
}

export function formatDateDisplay(iso: string): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

export default function SetupPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkRetryCount, setCheckRetryCount] = useState(0);
  const [progressStartDate, setProgressStartDate] = useState(getTodayIsoDate());
  const [examDate, setExamDate] = useState("2026-12-06");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check current program status on mount
  useEffect(() => {
    let isMounted = true;

    fetch("/api/program")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        const data = await res.json();
        return { status: res.status, data };
      })
      .then((result) => {
        if (!isMounted || !result) return;
        const { status, data } = result;

        if (status === 200 && data?.ok === true) {
          if (data?.data?.configured) {
            router.replace("/schedule");
            return;
          }
          // Successfully verified that program is not configured
          setIsChecking(false);
          return;
        }

        const msg = data?.error?.message || "Không thể kiểm tra trạng thái chương trình học.";
        setCheckError(msg);
        setIsChecking(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setCheckError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.");
        setIsChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router, checkRetryCount]);

  const handleRetryCheck = () => {
    setIsChecking(true);
    setCheckError(null);
    setCheckRetryCount((prev) => prev + 1);
  };

  const projectedDay100 = computeProjectedDay100(progressStartDate);
  const isDay100AfterExam = Boolean(
    projectedDay100 && examDate && projectedDay100 > examDate
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressStartDate || !examDate) {
      setErrorMessage("Vui lòng chọn ngày bắt đầu và ngày thi.");
      return;
    }

    if (examDate < progressStartDate) {
      setErrorMessage("Ngày thi phải từ ngày bắt đầu trở đi.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress_start_date: progressStartDate,
          exam_date: examDate,
        }),
      });

      const result = await response.json();

      if (result?.ok) {
        router.push("/schedule");
        router.refresh();
        return;
      }

      if (result?.error?.code === "PROGRAM_ALREADY_CONFIGURED") {
        router.push("/schedule");
        router.refresh();
        return;
      }

      if (result?.error?.message) {
        setErrorMessage(result.error.message);
      } else {
        setErrorMessage("Không thể tạo chương trình học. Vui lòng thử lại.");
      }
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans antialiased">
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
            N3
          </div>
          <p className="mt-3 text-sm text-slate-500">Đang kiểm tra chương trình học...</p>
        </div>
      </div>
    );
  }

  if (checkError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans antialiased">
        <div
          data-testid="setup-check-error"
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xs text-center"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-slate-800">
            Không thể tải trạng thái chương trình
          </h2>
          <p className="mt-1 text-sm text-slate-500">{checkError}</p>
          <button
            type="button"
            onClick={handleRetryCheck}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans antialiased">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm text-lg">
            N3
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-800">
            Thiết lập chương trình học
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lộ trình 100 ngày chuẩn bị cho kỳ thi JLPT N3
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            data-testid="setup-error-alert"
            className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
          >
            <AlertTriangleIcon className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="progress-start-date"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Ngày bắt đầu
              </label>
              <input
                id="progress-start-date"
                name="progressStartDate"
                type="date"
                required
                value={progressStartDate}
                onChange={(e) => setProgressStartDate(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="exam-date"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Ngày thi JLPT
              </label>
              <input
                id="exam-date"
                name="examDate"
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Program Schedule Preview Card */}
          <div
            data-testid="program-preview-card"
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Xem trước lộ trình
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white p-2.5 border border-slate-100 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400">
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>Ngày 1</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-800">
                  {formatDateDisplay(progressStartDate)}
                </div>
              </div>

              <div className="rounded-lg bg-white p-2.5 border border-slate-100 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400">
                  <TargetIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Ngày 100</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-800">
                  {formatDateDisplay(projectedDay100)}
                </div>
              </div>

              <div className="rounded-lg bg-white p-2.5 border border-slate-100 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400">
                  <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ngày thi</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-800">
                  {formatDateDisplay(examDate)}
                </div>
              </div>
            </div>

            {/* Warning if Day 100 is after Exam Date */}
            {isDay100AfterExam && (
              <div
                role="status"
                data-testid="day100-warning-alert"
                className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
              >
                <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Ngày 100 ({formatDateDisplay(projectedDay100)}) kết thúc sau ngày thi (
                  {formatDateDisplay(examDate)}). Bạn vẫn có thể bắt đầu chương trình học.
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Đang tạo chương trình..." : "Bắt đầu học ngay"}
          </button>
        </form>
      </div>
    </div>
  );
}
