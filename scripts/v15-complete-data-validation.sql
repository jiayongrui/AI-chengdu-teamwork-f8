-- 完整数据验证脚本 - 验证140条数据的准确性和完整性

-- 1. 基础统计验证
select 
  '数据总量检查' as check_type,
  count(*) as actual_count,
  140 as expected_count,
  case when count(*) = 140 then '✅ 通过' else '❌ 失败' end as status
from public.opportunities

union all

select 
  '公司数量统计',
  count(distinct company_name),
  null,
  '统计完成'
from public.opportunities

union all

select 
  '地区数量统计',
  count(distinct location),
  null,
  '统计完成'
from public.opportunities

union all

select 
  '行业数量统计',
  count(distinct industry),
  null,
  '统计完成'
from public.opportunities;

-- 2. 数据完整性检查
select 
  'company_name' as field_name,
  count(*) as total_records,
  count(company_name) as non_null_records,
  count(*) - count(company_name) as null_records,
  case when count(*) - count(company_name) = 0 then '✅ 无空值' else '❌ 存在空值' end as status
from public.opportunities

union all

select 
  'job_title',
  count(*),
  count(job_title),
  count(*) - count(job_title),
  case when count(*) - count(job_title) = 0 then '✅ 无空值' else '❌ 存在空值' end
from public.opportunities

union all

select 
  'location',
  count(*),
  count(location),
  count(*) - count(location),
  case when count(*) - count(location) = 0 then '✅ 无空值' else '❌ 存在空值' end
from public.opportunities

union all

select 
  'salary_range',
  count(*),
  count(salary_range),
  count(*) - count(salary_range),
  case when count(*) - count(salary_range) = 0 then '✅ 无空值' else '❌ 存在空值' end
from public.opportunities;

-- 3. 按公司统计职位数量（验证数据分布）
select 
  company_name,
  count(*) as job_count,
  string_agg(job_title, ' | ' order by job_title) as positions
from public.opportunities
group by company_name
having count(*) > 1
order by job_count desc, company_name;

-- 4. 按地区统计分布
select 
  location,
  count(*) as job_count,
  round(count(*) * 100.0 / (select count(*) from public.opportunities), 2) as percentage
from public.opportunities
where location is not null
group by location
order by job_count desc
limit 20;

-- 5. 按行业统计分布
select 
  industry,
  count(*) as job_count,
  round(count(*) * 100.0 / (select count(*) from public.opportunities), 2) as percentage
from public.opportunities
where industry is not null
group by industry
order by job_count desc;

-- 6. 薪资范围分布统计
select 
  salary_range,
  count(*) as job_count,
  round(count(*) * 100.0 / (select count(*) from public.opportunities), 2) as percentage
from public.opportunities
where salary_range is not null
group by salary_range
order by job_count desc
limit 20;

-- 7. 优先级分布验证
select 
  priority,
  count(*) as job_count,
  round(count(*) * 100.0 / (select count(*) from public.opportunities), 2) as percentage
from public.opportunities
group by priority
order by priority desc;

-- 8. 学历要求分布
select 
  education_required,
  count(*) as job_count,
  round(count(*) * 100.0 / (select count(*) from public.opportunities), 2) as percentage
from public.opportunities
where education_required is not null
group by education_required
order by job_count desc;

-- 9. 经验要求分布
select 
  experience_required,
  count(*) as job_count,
  round(count(*) * 100.0 / (select count(*) from public.opportunities), 2) as percentage
from public.opportunities
where experience_required is not null
group by experience_required
order by job_count desc;

-- 10. 公司规模分布
select 
  company_size,
  count(*) as job_count,
  round(count(*) * 100.0 / (select count(*) from public.opportunities), 2) as percentage
from public.opportunities
where company_size is not null
group by company_size
order by job_count desc;

-- 11. 抽样验证前10条记录的准确性
select 
  row_number() over (order by created_at) as row_num,
  company_name,
  job_title,
  location,
  salary_range,
  industry,
  priority
from public.opportunities
order by created_at
limit 10;

-- 12. 抽样验证最后10条记录的准确性
select 
  row_number() over (order by created_at desc) as reverse_row_num,
  company_name,
  job_title,
  location,
  salary_range,
  industry,
  priority
from public.opportunities
order by created_at desc
limit 10;
