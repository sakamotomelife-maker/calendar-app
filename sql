-- ============================================
-- 1) events テーブル（予定を保存）
-- ============================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date text not null,
  preset text,
  note text,
  color text,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- user_id に外部キー（Auth のユーザー）
alter table public.events
  add constraint fk_events_user
  foreign key (user_id)
  references auth.users (id)
  on delete cascade;

-- 同じユーザーが同じ日付に複数登録しないように制約
create unique index if not exists events_user_date_idx
  on public.events (user_id, date);


-- ============================================
-- 2) common_memo テーブル（共通メモ）
-- ============================================
create table if not exists public.common_memo (
  user_id uuid primary key,
  memo text,
  updated_at timestamp with time zone default now()
);

alter table public.common_memo
  add constraint fk_commonmemo_user
  foreign key (user_id)
  references auth.users (id)
  on delete cascade;


-- ============================================
-- 3) RLS（Row Level Security）有効化
-- ============================================
alter table public.events enable row level security;
alter table public.common_memo enable row level security;


-- ============================================
-- 4) RLS ポリシー（ユーザー自身のデータのみアクセス可能）
-- ============================================

-- events: SELECT
create policy "events_select_own"
on public.events
for select
using (auth.uid() = user_id);

-- events: INSERT
create policy "events_insert_own"
on public.events
for insert
with check (auth.uid() = user_id);

-- events: UPDATE
create policy "events_update_own"
on public.events
for update
using (auth.uid() = user_id);

-- events: DELETE
create policy "events_delete_own"
on public.events
for delete
using (auth.uid() = user_id);


-- common_memo: SELECT
create policy "memo_select_own"
on public.common_memo
for select
using (auth.uid() = user_id);

-- common_memo: INSERT
create policy "memo_insert_own"
on public.common_memo
for insert
with check (auth.uid() = user_id);

-- common_memo: UPDATE
create policy "memo_update_own"
on public.common_memo
for update
using (auth.uid() = user_id);

-- common_memo: DELETE
create policy "memo_delete_own"
on public.common_memo
for delete
using (auth.uid() = user_id);

