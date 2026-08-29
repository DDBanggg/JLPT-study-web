"use client";

import React, { useEffect, useState } from "react";
import { ScheduleHeader } from "./ScheduleHeader";
import { TaskCard, ScheduleTask } from "./TaskCard";
import { ContentPending } from "../common/ContentPending";
import { ErrorState } from "../common/ErrorState";

export interface ScheduleDayData {
  program_id: string;
  study_day: number;
  total_days: number;
  planned_date: string;
  roadmap_state: "planned" | "pending";
  phase: string | null;
  title: string | null;
  tasks: ScheduleTask[];
}

export interface ScheduleViewProps {
  day: number;
}

export function ScheduleView({ day }: ScheduleViewProps) {
  const [scheduleData, setScheduleData] = useState<ScheduleDayData | null>(null);
  const [currentStudyDay, setCurrentStudyDay] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadSchedule() {
      try {
        const [scheduleRes, programRes] = await Promise.all([
          fetch(`/api/schedule/day/${day}`),
          fetch("/api/program"),
        ]);

        if (programRes.status === 200) {
          const programJson = await programRes.json();
          if (programJson?.ok && programJson?.data?.program?.current_study_day) {
            if (isMounted) {
              setCurrentStudyDay(programJson.data.program.current_study_day);
            }
          }
        }

        const scheduleJson = await scheduleRes.json();

        if (scheduleRes.status === 200 && scheduleJson?.ok) {
          if (isMounted) {
            setScheduleData(scheduleJson.data);
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setErrorMessage(
            scheduleJson?.error?.message || "Không thể tải lịch học cho ngày này."
          );
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
          setIsLoading(false);
        }
      }
    }

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [day, retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setRetryCount((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-white border border-slate-200" />
          <div className="h-20 animate-pulse rounded-xl bg-white border border-slate-200" />
          <div className="h-20 animate-pulse rounded-xl bg-white border border-slate-200" />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={handleRetry} />;
  }

  if (!scheduleData) {
    return <ContentPending />;
  }

  const isRoadmapPending = scheduleData.roadmap_state === "pending";

  return (
    <div className="space-y-6">
      <ScheduleHeader
        studyDay={scheduleData.study_day}
        totalDays={scheduleData.total_days}
        plannedDate={scheduleData.planned_date}
        currentStudyDay={currentStudyDay}
        phase={scheduleData.phase}
        title={scheduleData.title}
      />

      {isRoadmapPending || scheduleData.tasks.length === 0 ? (
        <ContentPending message="Nội dung ngày này chưa được chuẩn bị." />
      ) : (
        <div className="space-y-3">
          {scheduleData.tasks.map((task) => (
            <TaskCard key={task.task_id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
