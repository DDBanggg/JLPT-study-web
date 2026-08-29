"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ScheduleIcon,
  CalendarIcon,
  LearnIcon,
  TestIcon,
  GrammarIcon,
  VocabularyIcon,
  KanjiIcon,
  ReadingIcon,
  ListeningIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LogoutIcon,
} from "../common/Icons";

export interface MobileNavProps {
  currentStudyDay: number;
}

export function MobileNav({ currentStudyDay }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(true);
  const [isTestOpen, setIsTestOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close drawer on path changes
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  // Lock body scroll and focus when drawer opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.status === 200 && data?.ok) {
        const redirectTo = data?.data?.redirect_to || "/login";
        router.replace(redirectTo);
        return;
      }
      setLogoutError(data?.error?.message || "Đăng xuất không thành công. Vui lòng thử lại.");
    } catch {
      setLogoutError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isScheduleActive = pathname === "/schedule" || pathname.startsWith("/schedule/");
  const isCalendarActive = pathname === "/calendar";
  const isLearnActive = pathname.startsWith("/learn/");
  const isTestActive = pathname.startsWith("/test/");

  return (
    <div className="lg:hidden">
      {/* Mobile Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-2xs">
            N3
          </div>
          <span className="font-bold text-slate-900 text-sm">JLPT N3 Study</span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="Mở menu điều hướng"
          aria-expanded={isOpen}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Slide-over Drawer Overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          className="fixed inset-0 z-50 flex"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                  N3
                </div>
                <span className="font-bold text-slate-900 text-sm">JLPT N3 Study</span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Đóng menu"
              >
                ✕
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1 text-xs">
              <Link
                href={`/schedule/day/${currentStudyDay}`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                  isScheduleActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <ScheduleIcon className="h-4 w-4 shrink-0" />
                <span>Schedule (Ngày {currentStudyDay})</span>
              </Link>

              <Link
                href="/calendar"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                  isCalendarActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <CalendarIcon className="h-4 w-4 shrink-0" />
                <span>Calendar</span>
              </Link>

              {/* Learn Group */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsLearnOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 font-medium transition-colors ${
                    isLearnActive
                      ? "text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LearnIcon className="h-4 w-4 shrink-0" />
                    <span>Learn</span>
                  </div>
                  {isLearnOpen ? (
                    <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>

                {isLearnOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-3">
                    <Link
                      href={`/learn/grammar/day/${currentStudyDay}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <GrammarIcon className="h-3.5 w-3.5" />
                      <span>Grammar</span>
                    </Link>
                    <Link
                      href={`/learn/vocabulary/day/${currentStudyDay}/list`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <VocabularyIcon className="h-3.5 w-3.5" />
                      <span>Vocabulary</span>
                    </Link>
                    <Link
                      href={`/learn/kanji/day/${currentStudyDay}/list`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <KanjiIcon className="h-3.5 w-3.5" />
                      <span>Kanji</span>
                    </Link>
                    <Link
                      href={`/learn/reading/day/${currentStudyDay}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <ReadingIcon className="h-3.5 w-3.5" />
                      <span>Reading</span>
                    </Link>
                    <Link
                      href={`/learn/listening/day/${currentStudyDay}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <ListeningIcon className="h-3.5 w-3.5" />
                      <span>Listening</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Test Group */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 font-medium transition-colors ${
                    isTestActive
                      ? "text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TestIcon className="h-4 w-4 shrink-0" />
                    <span>Test</span>
                  </div>
                  {isTestOpen ? (
                    <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>

                {isTestOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-3">
                    <Link
                      href="/test/grammar"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <span>Grammar Test</span>
                    </Link>
                    <Link
                      href="/test/daily"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <span>Daily Test</span>
                    </Link>
                    <Link
                      href="/test/weekly"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <span>Weekly Test</span>
                    </Link>
                    <Link
                      href="/test/monthly"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <span>Monthly Test</span>
                    </Link>
                    <Link
                      href="/test/end"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <span>End Test</span>
                    </Link>
                    <Link
                      href="/test/mock"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      <span>Test / Mock</span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Logout footer */}
            <div className="border-t border-slate-200 p-4">
              {logoutError && (
                <div className="mb-2 rounded-lg bg-red-50 p-2 text-[11px] text-red-700">
                  {logoutError}
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-400 transition-colors"
              >
                <LogoutIcon className="h-4 w-4" />
                <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
