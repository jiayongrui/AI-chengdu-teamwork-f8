-- 增强机会表结构，添加机会雷达卡片所需的新字段

-- 添加新字段到现有表
alter table public.opportunities 
  add column if not exists funding_stage text, -- 融资/阶段
  add column if not exists contact_person text, -- 联系人
  add column if not exists contact_method text, -- 联系方式
  add column if not exists job_level text, -- 职级
  add column if not exists valid_until date, -- 岗位有效期
  add column if not exists company_stage text, -- 公司阶段
  add column if not exists urgency_level integer default 1; -- 紧急程度 1-5

-- 添加索引优化查询
create index if not exists idx_opportunities_valid_until on public.opportunities(valid_until) where valid_until is not null;
create index if not exists idx_opportunities_funding_stage on public.opportunities(funding_stage) where funding_stage is not null;
create index if not exists idx_opportunities_job_level on public.opportunities(job_level) where job_level is not null;

-- 更新现有数据，添加示例联系信息和有效期
update public.opportunities set 
  funding_stage = case 
    when company_name in ('字节跳动', '腾讯', '阿里巴巴', '百度', '华为') then '已上市'
    when company_name in ('理想汽车', '蔚来汽车', '小鹏汽车', '宁德时代') then 'IPO'
    when company_name in ('小红书', '快手', '拼多多', '美团') then 'F轮'
    when company_name in ('元气森林', '完美日记', '泡泡玛特') then 'C轮'
    else 'B轮'
  end,
  contact_person = case 
    when job_title like '%工程师%' then 'HR-技术部'
    when job_title like '%产品%' then 'HR-产品部'
    when job_title like '%运营%' then 'HR-运营部'
    when job_title like '%销售%' then 'HR-销售部'
    when job_title like '%设计%' then 'HR-设计部'
    else 'HR-招聘部'
  end,
  contact_method = case 
    when company_name like '%字节%' then 'hr-tech@bytedance.com'
    when company_name like '%腾讯%' then 'recruitment@tencent.com'
    when company_name like '%阿里%' then 'jobs@alibaba-inc.com'
    when company_name like '%百度%' then 'zhaopin@baidu.com'
    when company_name like '%华为%' then 'career@huawei.com'
    else concat(lower(replace(company_name, ' ', '')), '@company.com')
  end,
  job_level = case 
    when experience_required like '%0-1年%' or experience_required like '%1年%' then 'P1-初级'
    when experience_required like '%1-3年%' or experience_required like '%2年%' then 'P2-中级'
    when experience_required like '%3-5年%' or experience_required like '%4年%' then 'P3-高级'
    when experience_required like '%5年%' or experience_required like '%5-8年%' then 'P4-专家'
    else 'P2-中级'
  end,
  valid_until = current_date + interval '30 days' + (random() * interval '60 days'),
  company_stage = case 
    when company_size = '10000+人' then '成熟期'
    when company_size = '1000-9999人' then '成长期'
    when company_size = '500-999人' then '扩张期'
    else '初创期'
  end,
  urgency_level = case 
    when priority >= 8 then 5
    when priority >= 6 then 4
    when priority >= 4 then 3
    when priority >= 2 then 2
    else 1
  end
where funding_stage is null;

-- 创建增强的机会视图
create or replace view public.opportunities_enhanced_view as
select 
  id,
  company_name,
  job_title,
  location,
  salary_range,
  funding_stage,
  contact_person,
  contact_method,
  job_level,
  valid_until,
  company_stage,
  urgency_level,
  tags,
  reason,
  priority,
  status,
  posted_date,
  created_at,
  -- 计算剩余有效天数
  case 
    when valid_until is not null then 
      greatest(0, extract(days from (valid_until - current_date))::integer)
    else null 
  end as days_remaining,
  -- 紧急程度标签
  case 
    when urgency_level = 5 then '🔥 急招'
    when urgency_level = 4 then '⚡ 优先'
    when urgency_level = 3 then '📋 正常'
    when urgency_level = 2 then '⏰ 储备'
    else '📝 长期'
  end as urgency_label
from public.opportunities
where status = 'active'
order by urgency_level desc, priority desc, posted_date desc;
