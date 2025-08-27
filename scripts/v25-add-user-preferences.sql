-- 为users表添加求职偏好字段
-- 支持onboarding流程的数据存储

-- 添加求职偏好相关字段
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS target_city TEXT,
ADD COLUMN IF NOT EXISTS target_keywords TEXT[],
ADD COLUMN IF NOT EXISTS target_salary TEXT,
ADD COLUMN IF NOT EXISTS preferences_updated_at TIMESTAMPTZ;

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_target_city ON public.users(target_city);
CREATE INDEX IF NOT EXISTS idx_users_preferences_updated ON public.users(preferences_updated_at);

-- 添加注释
COMMENT ON COLUMN public.users.target_city IS '目标工作城市';
COMMENT ON COLUMN public.users.target_keywords IS '目标岗位关键词数组';
COMMENT ON COLUMN public.users.target_salary IS '期望薪资范围';
COMMENT ON COLUMN public.users.preferences_updated_at IS '偏好设置更新时间';