-- 验证插入的142条记录是否正确
select 
  count(*) as total_records,
  count(distinct company_name) as unique_companies,
  count(distinct job_title) as unique_job_titles,
  count(distinct location) as unique_locations,
  count(case when salary_range is not null then 1 end) as records_with_salary,
  count(case when contact_method is not null then 1 end) as records_with_contact,
  count(case when valid_until is not null then 1 end) as records_with_deadline,
  min(posted_date) as earliest_post_date,
  max(posted_date) as latest_post_date
from public.opportunities;

-- 按公司统计
select 
  company_name,
  count(*) as job_count,
  string_agg(distinct job_title, ', ') as job_titles
from public.opportunities
group by company_name
order by job_count desc, company_name;

-- 按地区统计
select 
  location,
  count(*) as job_count
from public.opportunities
where location is not null
group by location
order by job_count desc;

-- 按薪资范围统计
select 
  salary_range,
  count(*) as job_count
from public.opportunities
where salary_range is not null
group by salary_range
order by job_count desc;

-- 按紧急程度统计
select 
  urgency_level,
  urgency_label,
  count(*) as job_count
from public.opportunities_enhanced_view
group by urgency_level, urgency_label
order by urgency_level desc;

-- 检查数据完整性
select 
  'Missing company_name' as issue,
  count(*) as count
from public.opportunities
where company_name is null or company_name = ''
union all
select 
  'Missing job_title' as issue,
  count(*) as count
from public.opportunities
where job_title is null or job_title = ''
union all
select 
  'Missing location' as issue,
  count(*) as count
from public.opportunities
where location is null or location = ''
union all
select 
  'Missing salary_range' as issue,
  count(*) as count
from public.opportunities
where salary_range is null or salary_range = ''
union all
select 
  'Missing contact_method' as issue,
  count(*) as count
from public.opportunities
where contact_method is null or contact_method = '';
