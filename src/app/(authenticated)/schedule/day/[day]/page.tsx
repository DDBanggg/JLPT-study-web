import React from "react";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export default async function ScheduleDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const studyDay = Math.max(1, Math.min(100, Number(day) || 1));

  return <ScheduleView day={studyDay} />;
}
