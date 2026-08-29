"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  SidebarCollapseIcon,
  SidebarExpandIcon,
} from "../common/Icons";
import { Tooltip } from "../common/Tooltip";

const SIDEBAR_STORAGE_KEY = "n3_sidebar_collapsed";
const sidebarListeners = new Set<() => void>();

function getSidebarSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot(): boolean {
  return false;
}

function subscribeSidebar(onStoreChange: () => void) {
  sidebarListeners.add(onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SIDEBAR_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    sidebarListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setSidebarCollapseState(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  } catch {
    // Ignore storage errors
  }
  sidebarListeners.forEach((listener) => listener());
}

export function toggleSidebarCollapse(): void {
  const current = getSidebarSnapshot();
  setSidebarCollapseState(!current);
}

export function useSidebarCollapse(): [boolean, () => void, (state: boolean) => void] {
  const isCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );
  return [isCollapsed, toggleSidebarCollapse, setSidebarCollapseState];
}

export interface SidebarProps {
  currentStudyDay?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({
  currentStudyDay = 1,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  className = "",
}: SidebarProps) {
  const pathname = usePathname() || "";
  const [storeCollapsed, storeToggleCollapse, storeSetCollapse] = useSidebarCollapse();

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : storeCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      storeToggleCollapse();
    }
  };

  const expandSidebar = () => {
    if (collapsed) {
      if (onToggleCollapse) {
        onToggleCollapse();
      } else {
        storeSetCollapse(false);
      }
    }
  };

  // Check active states
  const isScheduleActive = pathname === "/schedule" || pathname.startsWith("/schedule/");
  const isCalendarActive = pathname === "/calendar" || pathname.startsWith("/calendar/");

  const isLearnActive = pathname.startsWith("/learn/");
  const isGrammarActive = pathname.startsWith("/learn/grammar");
  const isVocabActive = pathname.startsWith("/learn/vocabulary");
  const isKanjiActive = pathname.startsWith("/learn/kanji");
  const isReadingActive = pathname.startsWith("/learn/reading");
  const isListeningActive = pathname.startsWith("/learn/listening");

  const isTestActive = pathname.startsWith("/test/");
  const isGrammarTestActive = pathname.startsWith("/test/grammar");
  const isDailyTestActive = pathname.startsWith("/test/daily");
  const isWeeklyTestActive = pathname.startsWith("/test/weekly");
  const isMonthlyTestActive = pathname.startsWith("/test/monthly");
  const isEndTestActive = pathname.startsWith("/test/end");
  const isMockTestActive = pathname.startsWith("/test/mock");

  // User manual expansion states for groups. Default is null (closed, unless active).
  const [isLearnUserExpanded, setIsLearnUserExpanded] = useState<boolean | null>(null);
  const [isTestUserExpanded, setIsTestUserExpanded] = useState<boolean | null>(null);

  const isLearnOpen = isLearnUserExpanded !== null ? isLearnUserExpanded : isLearnActive;
  const isTestOpen = isTestUserExpanded !== null ? isTestUserExpanded : isTestActive;

  const handleCollapsedLearnClick = () => {
    expandSidebar();
    setIsLearnUserExpanded(true);
  };

  const handleCollapsedTestClick = () => {
    expandSidebar();
    setIsTestUserExpanded(true);
  };

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-700 font-semibold"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const subNavItemClass = (isActive: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
      isActive
        ? "bg-blue-50/80 text-blue-700 font-semibold"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
    }`;

  return (
    <aside
      data-testid="desktop-sidebar"
      aria-label="Thanh điều hướng chính"
      className={`relative flex flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-in-out select-none ${
        collapsed ? "w-[72px]" : "w-64"
      } ${className}`}
    >
      {/* Brand / Logo Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
              N3
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-slate-800 tracking-tight">JLPT N3 Study</span>
              <span className="text-[11px] text-slate-400 font-normal">100 Days Roadmap</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
            N3
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
        {/* Schedule */}
        <Tooltip content="Schedule" disabled={!collapsed} side="right">
          <Link
            href="/schedule"
            className={`${navItemClass(isScheduleActive)} ${collapsed ? "justify-center px-0 w-11 h-11" : ""}`}
            title={collapsed ? "Schedule" : undefined}
          >
            <ScheduleIcon className={`shrink-0 ${isScheduleActive ? "text-blue-600" : "text-slate-500"}`} />
            {!collapsed && <span>Schedule</span>}
          </Link>
        </Tooltip>

        {/* Calendar */}
        <Tooltip content="Calendar" disabled={!collapsed} side="right">
          <Link
            href="/calendar"
            className={`${navItemClass(isCalendarActive)} ${collapsed ? "justify-center px-0 w-11 h-11" : ""}`}
            title={collapsed ? "Calendar" : undefined}
          >
            <CalendarIcon className={`shrink-0 ${isCalendarActive ? "text-blue-600" : "text-slate-500"}`} />
            {!collapsed && <span>Calendar</span>}
          </Link>
        </Tooltip>

        {/* Divider */}
        <div className="my-2 border-t border-slate-100" />

        {/* Learn Group */}
        <div>
          {collapsed ? (
            <Tooltip content="Học tập (Learn)" disabled={!collapsed} side="right">
              <button
                type="button"
                onClick={handleCollapsedLearnClick}
                className={`w-11 h-11 flex items-center justify-center rounded-lg mx-auto transition-colors ${
                  isLearnActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                aria-label="Learn section"
              >
                <LearnIcon className={isLearnActive ? "text-blue-600" : "text-slate-500"} />
              </button>
            </Tooltip>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setIsLearnUserExpanded(!isLearnOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg ${
                  isLearnActive ? "text-blue-700" : "text-slate-400 hover:text-slate-600"
                }`}
                aria-expanded={isLearnOpen}
              >
                <div className="flex items-center gap-2">
                  <LearnIcon className="w-4 h-4 text-slate-400" />
                  <span>Learn</span>
                </div>
                {isLearnOpen ? (
                  <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isLearnOpen && (
                <div className="mt-1 pl-4 space-y-0.5 border-l border-slate-100 ml-3">
                  <Link
                    href={`/learn/grammar/day/${currentStudyDay}`}
                    className={subNavItemClass(isGrammarActive)}
                  >
                    <GrammarIcon className={isGrammarActive ? "text-blue-600" : "text-slate-400"} />
                    <span>Grammar</span>
                  </Link>

                  <Link
                    href={`/learn/vocabulary/day/${currentStudyDay}/list`}
                    className={subNavItemClass(isVocabActive)}
                  >
                    <VocabularyIcon className={isVocabActive ? "text-blue-600" : "text-slate-400"} />
                    <span>Vocabulary</span>
                  </Link>

                  <Link
                    href={`/learn/kanji/day/${currentStudyDay}/list`}
                    className={subNavItemClass(isKanjiActive)}
                  >
                    <KanjiIcon className={isKanjiActive ? "text-blue-600" : "text-slate-400"} />
                    <span>Kanji</span>
                  </Link>

                  <Link
                    href={`/learn/reading/day/${currentStudyDay}`}
                    className={subNavItemClass(isReadingActive)}
                  >
                    <ReadingIcon className={isReadingActive ? "text-blue-600" : "text-slate-400"} />
                    <span>Reading</span>
                  </Link>

                  <Link
                    href={`/learn/listening/day/${currentStudyDay}`}
                    className={subNavItemClass(isListeningActive)}
                  >
                    <ListeningIcon className={isListeningActive ? "text-blue-600" : "text-slate-400"} />
                    <span>Listening</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Group */}
        <div className="pt-1">
          {collapsed ? (
            <Tooltip content="Luyện thi (Test)" disabled={!collapsed} side="right">
              <button
                type="button"
                onClick={handleCollapsedTestClick}
                className={`w-11 h-11 flex items-center justify-center rounded-lg mx-auto transition-colors ${
                  isTestActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                aria-label="Test section"
              >
                <TestIcon className={isTestActive ? "text-blue-600" : "text-slate-500"} />
              </button>
            </Tooltip>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setIsTestUserExpanded(!isTestOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg ${
                  isTestActive ? "text-blue-700" : "text-slate-400 hover:text-slate-600"
                }`}
                aria-expanded={isTestOpen}
              >
                <div className="flex items-center gap-2">
                  <TestIcon className="w-4 h-4 text-slate-400" />
                  <span>Test</span>
                </div>
                {isTestOpen ? (
                  <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isTestOpen && (
                <div className="mt-1 pl-4 space-y-0.5 border-l border-slate-100 ml-3">
                  <Link href="/test/grammar" className={subNavItemClass(isGrammarTestActive)}>
                    <span>Grammar Test</span>
                  </Link>

                  <Link href="/test/daily" className={subNavItemClass(isDailyTestActive)}>
                    <span>Daily Test</span>
                  </Link>

                  <Link href="/test/weekly" className={subNavItemClass(isWeeklyTestActive)}>
                    <span>Weekly Test</span>
                  </Link>

                  <Link href="/test/monthly" className={subNavItemClass(isMonthlyTestActive)}>
                    <span>Monthly Test</span>
                  </Link>

                  <Link href="/test/end" className={subNavItemClass(isEndTestActive)}>
                    <span>End Test</span>
                  </Link>

                  <Link href="/test/mock" className={subNavItemClass(isMockTestActive)}>
                    <span>Test / Mock</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Collapse / Expand Toggle Button Footer */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <Tooltip
          content={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          disabled={!collapsed}
          side="right"
        >
          <button
            type="button"
            onClick={handleToggle}
            className={`flex w-full items-center gap-3 rounded-lg py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors ${
              collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-3"
            }`}
            aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            {collapsed ? (
              <SidebarExpandIcon className="w-5 h-5" />
            ) : (
              <>
                <SidebarCollapseIcon className="w-5 h-5 shrink-0" />
                <span>Thu gọn thanh bên</span>
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
