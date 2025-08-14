-- 清空现有机会数据并重建表结构
-- 删除现有数据
truncate table public.opportunities restart identity cascade;

-- 删除现有视图
drop view if exists public.opportunities_enhanced_view;

-- 重新创建增强的机会表结构
alter table public.opportunities 
  drop column if exists funding_stage,
  drop column if exists contact_person,
  drop column if exists contact_method,
  drop column if exists job_level,
  drop column if exists valid_until,
  drop column if exists company_stage,
  drop column if exists urgency_level;

-- 添加新字段
alter table public.opportunities 
  add column funding_stage text,
  add column contact_person text,
  add column contact_method text,
  add column job_level text,
  add column valid_until date,
  add column company_stage text,
  add column urgency_level integer default 3,
  add column posted_date date default current_date;

-- 添加索引
create index if not exists idx_opportunities_valid_until on public.opportunities(valid_until);
create index if not exists idx_opportunities_funding_stage on public.opportunities(funding_stage);
create index if not exists idx_opportunities_job_level on public.opportunities(job_level);
create index if not exists idx_opportunities_posted_date on public.opportunities(posted_date);
