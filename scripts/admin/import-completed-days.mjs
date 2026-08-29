import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const PROGRAM_ID = "jlpt_n3_100_days_v1";
const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function addDays(isoDate, count) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid program start date");
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

async function findUserByEmail(supabase, email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
}

const [, , rawLoginId, ...rawDays] = process.argv;
const loginId = rawLoginId?.trim().toLowerCase();
if (!loginId || !LOGIN_ID_PATTERN.test(loginId) || rawDays.length < 1) {
  throw new Error(
    "Usage: node --env-file=.env.local scripts/admin/import-completed-days.mjs <login_id> <day...>",
  );
}

const days = [...new Set(rawDays.map(Number))].sort((left, right) => left - right);
if (days.some((day) => !Number.isInteger(day) || day < 1 || day > 100)) {
  throw new Error("Study Days must be integers from 1 to 100");
}

const supabase = createClient(
  requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const email = `${loginId}@${requiredEnvironment("AUTH_LOGIN_DOMAIN").trim().toLowerCase()}`;
const user = await findUserByEmail(supabase, email);
if (!user) throw new Error(`Auth user not found for Login ID ${loginId}`);

const { data: program, error: programError } = await supabase
  .from("user_programs")
  .select("progress_start_date")
  .eq("user_id", user.id)
  .eq("program_id", PROGRAM_ID)
  .single();
if (programError) throw programError;

const roadmap = JSON.parse(
  await readFile(path.resolve(process.cwd(), "content/roadmap/program.json"), "utf8"),
);
const rows = days.flatMap((studyDay) => {
  const roadmapDay = roadmap.days.find((entry) => entry.day === studyDay);
  if (!roadmapDay) throw new Error(`Roadmap is missing Study Day ${studyDay}`);
  const plannedDate = addDays(program.progress_start_date, studyDay - 1);
  return roadmapDay.tasks
    .filter((task) => task.required)
    .map((task) => ({
      user_id: user.id,
      program_id: PROGRAM_ID,
      study_day: studyDay,
      task_type: task.type,
      task_id: task.task_id,
      completed_at: `${plannedDate}T20:00:00+07:00`,
      completion_source: "migration",
    }));
});

const { error } = await supabase.from("task_progress").upsert(rows, {
  onConflict: "user_id,program_id,study_day,task_type,task_id",
  ignoreDuplicates: true,
});
if (error) throw error;

process.stdout.write(
  `Imported completion candidates for Login ID ${loginId}: Days ${days.join(", ")} (${rows.length} required tasks; existing rows preserved).\n`,
);
