"use client";

import React, { useEffect, useState } from "react";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export default function SchedulePage() {
  const [currentDay, setCurrentDay] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProgram() {
      try {
        const res = await fetch("/api/program");
        if (res.status === 200) {
          const json = await res.json();
          if (json?.ok && json?.data?.program?.current_study_day) {
            if (isMounted) {
              setCurrentDay(json.data.program.current_study_day);
              return;
            }
          }
        }
        if (isMounted) setCurrentDay(1);
      } catch {
        if (isMounted) setCurrentDay(1);
      }
    }
    loadProgram();
    return () => {
      isMounted = false;
    };
  }, []);

  if (currentDay === null) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-white border border-slate-200" />
          <div className="h-20 animate-pulse rounded-xl bg-white border border-slate-200" />
        </div>
      </div>
    );
  }

  return <ScheduleView day={currentDay} />;
}
