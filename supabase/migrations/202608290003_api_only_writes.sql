drop policy if exists user_programs_own_rows on public.user_programs;
drop policy if exists task_progress_own_rows on public.task_progress;
drop policy if exists grammar_viewed_own_rows on public.grammar_viewed;
drop policy if exists known_items_own_rows on public.known_items;
drop policy if exists learning_sets_own_rows on public.learning_sets;
drop policy if exists test_results_own_rows on public.test_results;

create policy user_programs_own_select on public.user_programs
for select using (auth.uid() = user_id);

create policy task_progress_own_select on public.task_progress
for select using (auth.uid() = user_id);

create policy grammar_viewed_own_select on public.grammar_viewed
for select using (auth.uid() = user_id);

create policy known_items_own_select on public.known_items
for select using (auth.uid() = user_id);

create policy learning_sets_own_select on public.learning_sets
for select using (auth.uid() = user_id);

create policy test_results_own_select on public.test_results
for select using (auth.uid() = user_id);

drop function if exists public.mark_known_and_replace(text, integer, text, integer, integer);

create function public.mark_known_and_replace(
  p_user_id uuid,
  p_program_id text,
  p_study_day integer,
  p_item_type text,
  p_item_id integer,
  p_replacement_item_id integer default null
)
returns integer[]
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item_ids integer[];
  v_new_item_ids integer[];
begin
  if p_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_study_day < 1 or p_study_day > 100 then
    raise exception 'INVALID_STUDY_DAY';
  end if;
  if p_item_type not in ('vocabulary','kanji') then
    raise exception 'INVALID_ITEM_TYPE';
  end if;

  select item_ids into v_item_ids
  from public.learning_sets
  where user_id = p_user_id
    and program_id = p_program_id
    and study_day = p_study_day
    and item_type = p_item_type
  for update;

  if v_item_ids is null then
    raise exception 'LEARNING_SET_NOT_FOUND';
  end if;
  if not (p_item_id = any(v_item_ids)) then
    raise exception 'ITEM_NOT_IN_ACTIVE_SET';
  end if;
  if p_replacement_item_id is not null and p_replacement_item_id = any(v_item_ids) then
    raise exception 'REPLACEMENT_ALREADY_ACTIVE';
  end if;

  insert into public.known_items (user_id, program_id, item_type, item_id)
  values (p_user_id, p_program_id, p_item_type, p_item_id)
  on conflict (user_id, program_id, item_type, item_id) do nothing;

  v_new_item_ids := array_remove(v_item_ids, p_item_id);
  if p_replacement_item_id is not null then
    v_new_item_ids := array_append(v_new_item_ids, p_replacement_item_id);
  end if;

  update public.learning_sets
  set item_ids = v_new_item_ids, updated_at = now()
  where user_id = p_user_id
    and program_id = p_program_id
    and study_day = p_study_day
    and item_type = p_item_type;

  return v_new_item_ids;
end;
$$;

drop function if exists public.record_test_submission(
  text, integer, text, text, text, text,
  integer, integer, integer, integer, integer, integer
);

create function public.record_test_submission(
  p_user_id uuid,
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
  v_result public.test_results;
begin
  if p_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  insert into public.test_results (
    user_id, program_id, study_day, test_id, test_type, completed_at,
    score, max_score, language_score, reading_score, listening_score, total_score
  ) values (
    p_user_id, p_program_id, p_study_day, p_test_id, p_test_type, now(),
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
    p_user_id, p_program_id, p_study_day, p_task_type, p_task_id, 'web'
  )
  on conflict (user_id, program_id, study_day, task_type, task_id) do nothing;

  return v_result;
end;
$$;

revoke all on function public.mark_known_and_replace(uuid, text, integer, text, integer, integer)
from public, anon, authenticated;
grant execute on function public.mark_known_and_replace(uuid, text, integer, text, integer, integer)
to service_role;

revoke all on function public.record_test_submission(
  uuid, text, integer, text, text, text, text,
  integer, integer, integer, integer, integer, integer
) from public, anon, authenticated;
grant execute on function public.record_test_submission(
  uuid, text, integer, text, text, text, text,
  integer, integer, integer, integer, integer, integer
) to service_role;
