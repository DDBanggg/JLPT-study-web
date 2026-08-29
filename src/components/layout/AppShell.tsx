"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopProgressHeader, ProgramHeaderInput, ProgramDto, ProgramProgressData } from "./TopProgressHeader";

export interface AppShellProps {
  children: React.ReactNode;
  program?: ProgramHeaderInput | null;
  currentStudyDay?: number;
}

export function AppShell({
  children,
  program,
  currentStudyDay,
}: AppShellProps) {
  const activeDay =
    currentStudyDay ??
    (program as ProgramDto | null | undefined)?.current_study_day ??
    (program as ProgramProgressData | null | undefined)?.currentStudyDay ??
    1;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Mobile Top Navigation (lg:hidden) */}
      <MobileNav currentStudyDay={activeDay} />

      {/* Desktop Collapsible Left Sidebar (hidden lg:flex) */}
      <Sidebar
        currentStudyDay={activeDay}
        className="hidden lg:flex sticky top-0 h-screen"
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Progress Header */}
        <TopProgressHeader program={program} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
