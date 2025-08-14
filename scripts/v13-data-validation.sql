-- 数据验证和统计查询
-- 用于检查插入的数据是否完整准确

-- 1. 统计总数据量
select 
  count(*) as total_records,
  count(distinct company_name) as unique_companies,
  count(distinct location) as unique_locations,
  count(distinct industry) as unique_industries
from public.opportunities;

-- 2. 按公司统计职位数量
select 
  company_name,
  count(*) as job_count,
  string_agg(job_title, ', ') as positions
from public.opportunities
group by company_name
order by job_count desc, company_name;

-- 3. 按地区统计分布
select 
  location,
  count(*) as job_count,
  count(distinct company_name) as company_count
from public.opportunities
where location is not null
group by location
order by job_count desc;

-- 4. 按行业统计分布
select 
  industry,
  count(*) as job_count,
  count(distinct company_name) as company_count
from public.opportunities
where industry is not null
group by industry
order by job_count desc;

-- 5. 薪资范围分布
select 
  salary_range,
  count(*) as job_count
from public.opportunities
where salary_range is not null
group by salary_range
order by job_count desc;

-- 6. 检查数据完整性
select 
  'company_name' as field_name,
  count(*) as total_count,
  count(company_name) as non_null_count,
  count(*) - count(company_name) as null_count
from public.opportunities
union all
select 
  'job_title',
  count(*),
  count(job_title),
  count(*) - count(job_title)
from public.opportunities
union all
select 
  'location',
  count(*),
  count(location),
  count(*) - count(location)
from public.opportunities
union all
select 
  'salary_range',
  count(*),
  count(salary_range),
  count(*) - count(salary_range)
from public.opportunities;

-- 7. 优先级分布
select 
  priority,
  count(*) as job_count,
  round(count(*) * 100.0 / (select count(*) from public.opportunities), 2) as percentage
from public.opportunities
group by priority
order by priority desc;
