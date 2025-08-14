-- 更新应用中的机会数据结构
-- 为现有的机会管理功能提供数据支持

-- 创建视图，简化前端查询
create or replace view public.opportunities_view as
select 
  id,
  company_name as company,
  job_title as title,
  location as city,
  salary_range,
  tags,
  reason,
  priority,
  status,
  posted_date,
  created_at
from public.opportunities
where status = 'active'
order by priority desc, posted_date desc;

-- 为管理员功能创建完整视图
create or replace view public.opportunities_admin_view as
select 
  id,
  company_name,
  job_title,
  location,
  salary_range,
  job_type,
  experience_required,
  education_required,
  job_description,
  company_size,
  industry,
  benefits,
  contact_email,
  contact_person,
  application_deadline,
  posted_date,
  status,
  tags,
  reason,
  priority,
  source,
  created_at,
  updated_at
from public.opportunities
order by priority desc, posted_date desc;

-- 创建统计视图
create or replace view public.opportunities_stats as
select 
  count(*) as total_opportunities,
  count(*) filter (where status = 'active') as active_opportunities,
  count(*) filter (where posted_date >= current_date - interval '7 days') as new_this_week,
  count(distinct location) as total_locations,
  count(distinct industry) as total_industries,
  avg(priority) as avg_priority
from public.opportunities;
