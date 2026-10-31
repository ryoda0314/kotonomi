-- ことのみ: a learner's record (the State of src/lib/record.ts), one row per account. The accounts are ことのあめ's
-- (the same Supabase project, as for ことのは, ことのめ, ことのえだ and ことのかげ); everything of this app's is prefixed vc_
-- (for the vocabulary, as the device's key vocab:v1, so a new name for the app changes nothing here), and nothing of
-- ことのあめ (pl_), ことのおと (kn_), ことのは (en_), ことのめ (hg_), ことのえだ (ke_), ことのかげ (sh_) or the old app is
-- touched. Read and written from the browser as the learner (RLS: only their own row).
create table if not exists public.vc_records (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  -- The record keeps 40 times per word and kind and its newest 400 rounds; this keeps the table from being used as storage.
  constraint vc_records_size check (pg_column_size(state) < 1048576)
);

alter table public.vc_records enable row level security;

drop policy if exists "vc_records own" on public.vc_records;
create policy "vc_records own" on public.vc_records
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
