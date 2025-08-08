-- Supabase 初始化脚本（Demo）
-- 作用：
-- 1) 创建 tasks 表
-- 2) 关闭 tasks 表的 RLS（Row Level Security）
-- 3) 插入示例任务数据（可选）
-- 使用说明：
-- - 在你的 Supabase 项目 SQL Editor 中执行本脚本
-- - 获取 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY，配置到环境变量后刷新应用

-- 需要 pgcrypto 以使用 gen_random_uuid()
create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null check (status in ('pool','sent','replied','interview')),
  ord int not null default 0,
  note text null,
  created_at timestamptz not null default now()
);

-- Demo 产品：关闭表的 RLS
alter table public.tasks disable row level security;

-- 可选：清空并插入演示数据
-- 注意：生产环境不要随意清空
truncate table public.tasks;

insert into public.tasks (title, status, ord, note) values
('奇点无限', 'pool', 1, null),
('像素跃动', 'pool', 2, null),
('矩阵数据', 'sent', 1, null),
('云端畅想', 'sent', 2, '跟进提醒: 3天后'),
('深空探索', 'replied', 1, null),
('未来智能', 'interview', 1, null);
