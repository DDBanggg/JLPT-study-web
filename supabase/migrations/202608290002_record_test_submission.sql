create or replace function public.record_test_submission(
  p_program_id text,
  p_study_day integer,
  p_test_id text,
  p_test_type text,
  p_task_type text,
  p_task_id text,
  p_score integer,
  p_max_score integer,
  p_language_score integer,
  p_reading_score integer,
  p_listening_score integer,
  p_total_score integer
)
returns public.test_results
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_result public.test_results;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  insert into public.test_results (
    user_id, program_id, study_day, test_id, test_type, completed_at,
    score, max_score, language_score, reading_score, listening_score, total_score
  ) values (
    v_user_id, p_program_id, p_study_day, p_test_id, p_test_type, now(),
    p_score, p_max_score, p_language_score, p_reading_score, p_listening_score, p_total_score
  )
  on conflict (user_id, program_id, test_id) do update set
    study_day = excluded.study_day,
    test_type = excluded.test_type,
    completed_at = excluded.completed_at,
    score = excluded.score,
    max_score = excluded.max_score,
    language_score = excluded.language_score,
    reading_score = excluded.reading_score,
    listening_score = excluded.listening_score,
    total_score = excluded.total_score
  returning * into v_result;

  insert into public.task_progress (
    user_id, program_id, study_day, task_type, task_id, completion_source
  ) values (
    v_user_id, p_program_id, p_study_day, p_task_type, p_task_id, 'web'
  )
  on conflict (user_id, program_id, study_day, task_type, task_id) do nothing;

  return v_result;
end;
$$;
