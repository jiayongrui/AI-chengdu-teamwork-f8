-- 创建机会数据表结构
-- 基于提供的招聘数据表格设计

-- 删除旧表（如果存在）
drop table if exists public.opportunities cascade;

-- 创建新的机会表
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  job_title text not null,
  location text,
  salary_range text,
  job_type text, -- 全职/兼职/实习等
  experience_required text, -- 经验要求
  education_required text, -- 学历要求
  job_description text,
  company_size text, -- 公司规模
  industry text, -- 行业
  benefits text, -- 福利待遇
  contact_email text,
  contact_person text,
  application_deadline date,
  posted_date timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'inactive', 'expired')),
  tags text[], -- 标签数组
  reason text, -- 推荐理由
  priority integer default 0, -- 优先级
  source text default 'manual', -- 数据来源
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 禁用 RLS（Demo 环境）
alter table public.opportunities disable row level security;

-- 创建索引
create index idx_opportunities_company on public.opportunities(company_name);
create index idx_opportunities_location on public.opportunities(location);
create index idx_opportunities_industry on public.opportunities(industry);
create index idx_opportunities_status on public.opportunities(status);
create index idx_opportunities_posted_date on public.opportunities(posted_date desc);
create index idx_opportunities_tags on public.opportunities using gin(tags);

-- 创建更新时间触发器
create or replace function update_opportunities_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_opportunities_updated_at
  before update on public.opportunities
  for each row
  execute function update_opportunities_updated_at();
