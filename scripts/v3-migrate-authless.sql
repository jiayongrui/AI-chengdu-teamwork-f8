-- DEMO 迁移脚本 v3：修复无法注册的常见后端原因
-- 作用：
-- 1) 创建自建 users 表（若不存在）
-- 2) 为 tasks 表补充 user_id 字段（若缺失），并与 users 关联
-- 3) 统一禁用 users/tasks 表的 RLS（按你的 Demo 要求）
-- 4) 补充必要索引与状态检查约束
-- 5) 将历史无 user_id 的任务归属到 demo 用户，避免前端查询为空或插入失败
-- 使用方法：在 Supabase SQL Editor 中一次性执行

-- 需要 pgcrypto 用于 gen_random_uuid()
create extension if not exists "pgcrypto";

-- 1) 自建用户表（不使用 Supabase Auth）
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_md5 text not null,
  created_at timestamptz not null default now()
);

-- 2) 任务表（若不存在则创建，存在则补字段）
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null,
  ord int not null default 0,
  note text null,
  user_id uuid null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 如果 tasks.status 没有检查约束，则添加
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_status_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_status_check
      check (status in ('pool','sent','replied','interview'));
  end if;
end$$;

-- 如果 tasks 缺少 user_id 列（老版本），则补齐并加外键
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tasks' and column_name='user_id'
  ) then
    alter table public.tasks
      add column user_id uuid null;
    alter table public.tasks
      add constraint tasks_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
end$$;

-- 3) 禁用 RLS（Demo）
alter table public.users disable row level security;
alter table public.tasks disable row level security;

-- 4) 必要索引
create index if not exists idx_users_username on public.users(username);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_user_status on public.tasks(user_id, status);

-- 5) 兜底：把历史无归属的任务绑定到 demo 用户
--    先确保 demo 用户存在（密码置空 md5：d41d8cd98f00b204e9800998ecf8427e）
insert into public.users (username, password_md5)
select 'demo', 'd41d8cd98f00b204e9800998ecf8427e'
where not exists (select 1 from public.users where username='demo');

--    绑定历史任务
update public.tasks t
set user_id = u.id
from public.users u
where t.user_id is null
  and u.username = 'demo';
