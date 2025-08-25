-- 为opportunities表添加contact_phone字段
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_phone
ON public.opportunities(contact_phone)
WHERE contact_phone IS NOT NULL;