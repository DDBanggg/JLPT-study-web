-- N3 Study Web — SQL Schema v1.1
-- Status: Frozen for first desktop implementation
-- Date: 2026-08-29
-- Target: Supabase PostgreSQL

create extension if not exists pgcrypto;

-- ============================================================
-- 1. user_programs
-- ============================================================
create table if not exists public.user_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id text not null,
  progress_start_date date not null,
  exam_date date not null,
  created_at timestamptz not null default now(),
  constraint user_programs_user_program_unique unique (user_id, program_id),
  constraint user_programs_exam_after_start_check check (exam_date >= progress_start_date)
);

-- ============================================================
-- 2. task_progress
-- ============================================================
create table if not exists public.task_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  program_id text not null,
  study_day integer not null check (study_day between 1 and 100),
  task_type text not null check (
    task_type in (
      'grammar','grammar_test','vocabulary','kanji','reading','listening',
      'daily_test','weekly_test','monthly_test','end_test','mock_test'
    )
  ),
  task_id text not null,
  completed_at timestamptz not null default now(),
  completion_source text not null default 'web'
    check (completion_source in ('web','migration')),
  constraint task_progress_program_fk
    foreign key (user_id, program_id)
    references public.user_programs(user_id, program_id)
    on delete cascade,
  constraint task_progress_logical_unique
    unique (user_id, program_id, study_day, task_type, task_id)
);

-- ============================================================
-- 3. grammar_viewed
-- ============================================================
create table if not exists public.grammar_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  program_id text not null,
  study_day integer not null check (study_day between 1 and 100),
  grammar_id integer not null,
  viewed_at timestamptz not null default now(),
  constraint grammar_viewed_program_fk
    foreign key (user_id, program_id)
    references public.user_programs(user_id, program_id)
    on delete cascade,
  constraint grammar_viewed_logical_unique
    unique (user_id, program_id, study_day, grammar_id)
);

-- ============================================================
-- 4. known_items
-- ============================================================
create table if not exists public.known_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  program_id text not null,
  item_type text not null check (item_type in ('vocabulary','kanji')),
  item_id integer not null,
  marked_at timestamptz not null default now(),
  constraint known_items_program_fk
    foreign key (user_id, program_id)
    references public.user_programs(user_id, program_id)
    on delete cascade,
  constraint known_items_logical_unique
    unique (user_id, program_id, item_type, item_id)
);

-- ============================================================
-- 5. learning_sets
-- ============================================================
create table if not exists public.learning_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  program_id text not null,
  study_day integer not null check (study_day between 1 and 100),
  item_type text not null check (item_type in ('vocabulary','kanji')),
  item_ids integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_sets_program_fk
    foreign key (user_id, program_id)
    references public.user_programs(user_id, program_id)
    on delete cascade,
  constraint learning_sets_logical_unique
    unique (user_id, program_id, study_day, item_type),
  constraint learning_sets_max_size_check check (
    (item_type = 'vocabulary' and cardinality(item_ids) <= 50)
    or
    (item_type = 'kanji' and cardinality(item_ids) <= 30)
  )
);

-- ============================================================
-- 6. test_results
-- ============================================================
create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  program_id text not null,
  study_day integer check (study_day is null or study_day between 1 and 100),
  test_id text not null,
  test_type text not null check (test_type in ('grammar','daily','weekly','monthly','end','mock')),
  completed_at timestamptz not null default now(),
  score integer,
  max_score integer,
  language_score integer check (language_score is null or language_score between 0 and 60),
  reading_score integer check (reading_score is null or reading_score between 0 and 60),
  listening_score integer check (listening_score is null or listening_score between 0 and 60),
  total_score integer check (total_score is null or total_score between 0 and 180),
  constraint test_results_program_fk
    foreign key (user_id, program_id)
    references public.user_programs(user_id, program_id)
    on delete cascade,
  constraint test_results_latest_only_unique unique (user_id, program_id, test_id),
  constraint test_results_raw_or_scaled_check check (
    (
      test_type in ('grammar','daily')
      and score is not null
      and max_score is not null
      and language_score is null
      and reading_score is null
      and listening_score is null
      and total_score is null
    )
    or
    (
      test_type in ('weekly','monthly','end','mock')
      and score is null
      and max_score is null
      and language_score is not null
      and reading_score is not null
      and listening_score is not null
      and total_score is not null
    )
  )
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists task_progress_user_day_idx
  on public.task_progress(user_id, program_id, study_day);

create index if not exists grammar_viewed_user_day_idx
  on public.grammar_viewed(user_id, program_id, study_day);

create index if not exists known_items_user_type_idx
  on public.known_items(user_id, program_id, item_type);

create index if not exists learning_sets_user_day_idx
  on public.learning_sets(user_id, program_id, study_day);

create index if not exists test_results_user_type_idx
  on public.test_results(user_id, program_id, test_type);

-- ============================================================
-- RLS
-- ============================================================
alter table public.user_programs enable row level security;
alter table public.task_progress enable row level security;
alter table public.grammar_viewed enable row level security;
alter table public.known_items enable row level security;
alter table public.learning_sets enable row level security;
alter table public.test_results enable row level security;

drop policy if exists user_programs_own_rows on public.user_programs;
create policy user_programs_own_rows on public.user_programs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists task_progress_own_rows on public.task_progress;
create policy task_progress_own_rows on public.task_progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists grammar_viewed_own_rows on public.grammar_viewed;
create policy grammar_viewed_own_rows on public.grammar_viewed
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists known_items_own_rows on public.known_items;
create policy known_items_own_rows on public.known_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists learning_sets_own_rows on public.learning_sets;
create policy learning_sets_own_rows on public.learning_sets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists test_results_own_rows on public.test_results;
create policy test_results_own_rows on public.test_results
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- RPC: Known + replacement as one DB operation.
-- Backend still validates the replacement against authoritative JSON.
-- ============================================================
create or replace function public.mark_known_and_replace(
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
  v_user_id uuid;
  v_item_ids integer[];
  v_new_item_ids integer[];
begin
  v_user_id := auth.uid();

  if v_user_id is null then
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
  where user_id = v_user_id
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

  if p_replacement_item_id is not null
     and p_replacement_item_id = any(v_item_ids) then
    raise exception 'REPLACEMENT_ALREADY_ACTIVE';
  end if;

  insert into public.known_items (
    user_id, program_id, item_type, item_id
  ) values (
    v_user_id, p_program_id, p_item_type, p_item_id
  )
  on conflict (user_id, program_id, item_type, item_id) do nothing;

  v_new_item_ids := array_remove(v_item_ids, p_item_id);

  if p_replacement_item_id is not null then
    v_new_item_ids := array_append(v_new_item_ids, p_replacement_item_id);
  end if;

  update public.learning_sets
  set item_ids = v_new_item_ids,
      updated_at = now()
  where user_id = v_user_id
    and program_id = p_program_id
    and study_day = p_study_day
    and item_type = p_item_type;

  return v_new_item_ids;
end;
$$;

-- Backend implementation notes:
-- 1. First learning-set creation: INSERT ... ON CONFLICT DO NOTHING, then SELECT.
-- 2. Replacement candidate must come from same Study Day JSON pool, in priority order,
--    not Known, and not already active.
-- 3. Calendar status is derived in backend/application logic, never stored.
-- 4. Test answers/review are not persisted.
-- 5. Migration must supply actual historical completed_at timestamps.
