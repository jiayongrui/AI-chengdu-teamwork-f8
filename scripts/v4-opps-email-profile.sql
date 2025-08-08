-- DEMO 升级脚本 v4：机会卡片/破冰工坊/邮件发送与简历文本
-- 1) users 表增加 resume_text（存储简历纯文本，便于个性化生成）
alter table public.users
  add column if not exists resume_text text null;

-- 2) emails 表：记录发送日志
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company text not null,
  title text not null,
  subject text not null,
  body text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

-- Demo 要求：禁用 RLS
alter table public.emails disable row level security;

create index if not exists idx_emails_user on public.emails(user_id);
create index if not exists idx_emails_user_created on public.emails(user_id, created_at desc);
