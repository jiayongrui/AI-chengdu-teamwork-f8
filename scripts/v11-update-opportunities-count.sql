-- 更新机会统计和索引优化

-- 重新创建统计视图
drop view if exists public.opportunities_stats;
create or replace view public.opportunities_stats as
select 
  count(*) as total_opportunities,
  count(*) filter (where status = 'active') as active_opportunities,
  count(*) filter (where posted_date >= current_date - interval '7 days') as new_this_week,
  count(*) filter (where posted_date >= current_date - interval '30 days') as new_this_month,
  count(distinct location) as total_locations,
  count(distinct industry) as total_industries,
  count(distinct company_name) as total_companies,
  avg(priority) as avg_priority,
  max(priority) as max_priority,
  min(priority) as min_priority
from public.opportunities;

-- 创建热门公司视图
create or replace view public.popular_companies as
select 
  company_name,
  count(*) as job_count,
  avg(priority) as avg_priority,
  array_agg(distinct industry) as industries,
  array_agg(distinct location) as locations
from public.opportunities
where status = 'active'
group by company_name
having count(*) >= 1
order by job_count desc, avg_priority desc;

-- 创建热门地区视图
create or replace view public.popular_locations as
select 
  location,
  count(*) as job_count,
  avg(priority) as avg_priority,
  array_agg(distinct industry) as industries,
  count(distinct company_name) as company_count
from public.opportunities
where status = 'active' and location is not null
group by location
having count(*) >= 1
order by job_count desc, avg_priority desc;

-- 创建行业分布视图
create or replace view public.industry_distribution as
select 
  industry,
  count(*) as job_count,
  avg(priority) as avg_priority,
  count(distinct company_name) as company_count,
  count(distinct location) as location_count
from public.opportunities
where status = 'active' and industry is not null
group by industry
having count(*) >= 1
order by job_count desc, avg_priority desc;

-- 添加全文搜索索引
create index if not exists idx_opportunities_search 
on public.opportunities 
using gin(to_tsvector('chinese', company_name || ' ' || job_title || ' ' || coalesce(job_description, '')));

-- 添加薪资范围索引（用于薪资筛选）
create index if not exists idx_opportunities_salary 
on public.opportunities(salary_range) 
where salary_range is not null;

-- 添加复合索引优化查询性能
create index if not exists idx_opportunities_location_industry 
on public.opportunities(location, industry) 
where status = 'active';

create index if not exists idx_opportunities_priority_posted 
on public.opportunities(priority desc, posted_date desc) 
where status = 'active';
