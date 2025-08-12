-- DEMO 升级脚本 v5：简历管理表
-- 1) 创建 resumes 表用于存储用户的多份简历
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Demo 要求：禁用 RLS
alter table public.resumes disable row level security;

-- 索引
create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_resumes_user_updated on public.resumes(user_id, updated_at desc);

-- 触发器：自动更新 updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_resumes_updated_at
  before update on public.resumes
  for each row
  execute function update_updated_at_column();
