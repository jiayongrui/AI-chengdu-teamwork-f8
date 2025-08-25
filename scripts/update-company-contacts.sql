-- 为opportunities表添加contact_phone字段（如果不存在）
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 更新公司联系信息
-- 根据用户提供的8家公司数据更新邮箱和电话

-- 上海缠山科技有限公司
UPDATE public.opportunities 
SET contact_email = '1119143624@qq.com'
WHERE company_name LIKE '%缠山科技%' OR company_name LIKE '%上海缠山%';

-- 辛恩励科技有限公司
UPDATE public.opportunities 
SET contact_phone = '18512176096'
WHERE company_name LIKE '%辛恩励%';

-- 杭州知行元科技
UPDATE public.opportunities 
SET contact_email = '18796827019@163.com',
    contact_phone = '18796827019'
WHERE company_name LIKE '%知行元%' OR company_name LIKE '%杭州知行元%';

-- 蜜蜂数联
UPDATE public.opportunities 
SET contact_email = 'mifengshulian@hotmai',
    contact_phone = '13637920466'
WHERE company_name LIKE '%蜜蜂数联%';

-- 皓域科技（河北）有限责任公司
UPDATE public.opportunities 
SET contact_phone = '15612272355'
WHERE company_name LIKE '%皓域科技%' OR company_name LIKE '%皓域%';

-- 雄安九典科技有限公司
UPDATE public.opportunities 
SET contact_phone = '15251832263'
WHERE company_name LIKE '%九典科技%' OR company_name LIKE '%雄安九典%';

-- 苏州苏纳光电有限公司
UPDATE public.opportunities 
SET contact_email = 'yyhuang2006@sinano.ac.cn',
    contact_phone = '13306136603'
WHERE company_name LIKE '%苏纳光电%' OR company_name LIKE '%苏州苏纳%';

-- 聚合吧科技有限公司
UPDATE public.opportunities 
SET contact_email = '15589871755@139.com',
    contact_phone = '15589871755'
WHERE company_name LIKE '%聚合吧%';

-- 查看更新结果
SELECT company_name, contact_email, contact_phone 
FROM public.opportunities 
WHERE contact_email IS NOT NULL OR contact_phone IS NOT NULL
ORDER BY company_name;