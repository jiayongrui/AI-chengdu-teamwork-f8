-- DEMO 升级脚本 v6：增强邮件追踪功能
-- 为 emails 表添加更多追踪字段

-- 为 emails 表添加新字段
alter table public.emails
  add column if not exists recipient_email text null,
  add column if not exists message_id text null,
  add column if not exists sent_at timestamptz null default now();

-- 为 tasks 表的 note 字段添加索引（如果需要搜索）
create index if not exists idx_tasks_note on public.tasks using gin(to_tsvector('english', note)) where note is not null;

-- 为 emails 表添加索引
create index if not exists idx_emails_message_id on public.emails(message_id) where message_id is not null;
create index if not exists idx_emails_recipient on public.emails(recipient_email) where recipient_email is not null;
create index if not exists idx_emails_sent_at on public.emails(sent_at desc);
