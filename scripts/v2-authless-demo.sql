-- DEMO 数据库脚本 v2（自建用户体系 + 任务关联）
-- 执行位置：Supabase SQL Editor
-- 注意：这是 Demo，已禁用所有表的 RLS。请勿用于生产。

create extension if not exists "pgcrypto";

-- 用户表（自建，不使用 Supabase Auth）
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_md5 text not null,
  created_at timestamptz not null default now()
);

alter table public.users disable row level security;

-- 任务表（若不存在则创建）
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null check (status in ('pool','sent','replied','interview')),
  ord int not null default 0,
  note text null,
  user_id uuid null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.tasks disable row level security;

-- 索引（便于查询与排序）
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_user_status on public.tasks(user_id, status);

-- 可选：清空旧的演示数据（谨慎）
-- truncate table public.tasks;
-- truncate table public.users;

-- 可选：插入一个演示用户与其任务（测试用）
-- with u as (
--   insert into public.users (username, password_md5) values ('demo', '827ccb0eea8a706c4c34a16891f84e7b') -- 12345 的 md5
--   returning id
-- )
-- insert into public.tasks (title, status, ord, note, user_id) values
-- ('奇点无限', 'pool', 1, null, (select id from u)),
-- ('像素跃动', 'pool', 2, null, (select id from u)),
-- ('矩阵数据', 'sent', 1, null, (select id from u)),
-- ('云端畅想', 'sent', 2, '跟进提醒: 3天后', (select id from u)),
-- ('深空探索', 'replied', 1, null, (select id from u)),
-- ('未来智能', 'interview', 1, null, (select id from u));
