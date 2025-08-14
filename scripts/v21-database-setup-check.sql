-- 检查和修复数据库设置
-- 首先检查表是否存在
DO $$
BEGIN
    -- 检查 opportunities 表是否存在
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'opportunities') THEN
        RAISE NOTICE 'Creating opportunities table...';
        
        -- 创建机会表
        CREATE TABLE public.opportunities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_name TEXT NOT NULL,
          job_title TEXT NOT NULL,
          location TEXT,
          salary_range TEXT,
          job_type TEXT DEFAULT '全职',
          experience_required TEXT,
          education_required TEXT,
          job_description TEXT,
          company_size TEXT,
          industry TEXT,
          benefits TEXT,
          contact_email TEXT,
          contact_person TEXT,
          application_deadline DATE,
          posted_date DATE DEFAULT CURRENT_DATE,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
          tags TEXT[],
          reason TEXT,
          priority INTEGER DEFAULT 5,
          source TEXT DEFAULT 'manual',
          funding_stage TEXT,
          contact_method TEXT,
          job_level TEXT,
          valid_until DATE,
          company_stage TEXT,
          urgency_level INTEGER DEFAULT 3,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- 禁用 RLS
        ALTER TABLE public.opportunities DISABLE ROW LEVEL SECURITY;

        -- 创建索引
        CREATE INDEX idx_opportunities_company ON public.opportunities(company_name);
        CREATE INDEX idx_opportunities_location ON public.opportunities(location);
        CREATE INDEX idx_opportunities_status ON public.opportunities(status);
        CREATE INDEX idx_opportunities_priority ON public.opportunities(priority DESC);
        CREATE INDEX idx_opportunities_urgency ON public.opportunities(urgency_level DESC);
        CREATE INDEX idx_opportunities_posted_date ON public.opportunities(posted_date DESC);
        
        RAISE NOTICE 'Opportunities table created successfully';
    ELSE
        RAISE NOTICE 'Opportunities table already exists';
    END IF;

    -- 检查视图是否存在
    IF NOT EXISTS (SELECT FROM information_schema.views WHERE table_name = 'opportunities_enhanced_view') THEN
        RAISE NOTICE 'Creating opportunities_enhanced_view...';
        
        -- 创建增强视图
        CREATE OR REPLACE VIEW public.opportunities_enhanced_view AS
        SELECT 
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
          CASE 
            WHEN valid_until IS NOT NULL THEN 
              GREATEST(0, EXTRACT(DAYS FROM (valid_until - CURRENT_DATE))::INTEGER)
            ELSE NULL 
          END AS days_remaining,
          -- 紧急程度标签
          CASE 
            WHEN urgency_level = 5 THEN '🔥 急招'
            WHEN urgency_level = 4 THEN '⚡ 优先'
            WHEN urgency_level = 3 THEN '📋 正常'
            WHEN urgency_level = 2 THEN '⏰ 储备'
            ELSE '📝 长期'
          END AS urgency_label
        FROM public.opportunities
        WHERE status = 'active'
        ORDER BY urgency_level DESC, priority DESC, posted_date DESC;
        
        RAISE NOTICE 'Enhanced view created successfully';
    ELSE
        RAISE NOTICE 'Enhanced view already exists';
    END IF;

    -- 检查数据是否存在
    IF (SELECT COUNT(*) FROM public.opportunities) = 0 THEN
        RAISE NOTICE 'Inserting sample data...';
        
        -- 插入一些示例数据
        INSERT INTO public.opportunities (
          company_name, job_title, location, salary_range, contact_person, contact_method, 
          job_level, valid_until, funding_stage, company_stage, urgency_level, 
          tags, reason, priority, status, posted_date, industry, experience_required, education_required
        ) VALUES 
        ('字节跳动', 'AI算法工程师', '北京', '30-50k·14薪', 'HR-张静', 'zhangjing@bytedance.com', 'P3-5', '2025-09-15', 'IPO', '成熟期', 5, ARRAY['AI', '算法', '机器学习', '大厂'], '字节跳动AI技术投入大，算法岗位需求旺盛', 9, 'active', '2025-01-15', '互联网', '3-5年', '本科'),
        ('腾讯', '人工智能算法工程师', '深圳', '25-45k·16薪', 'HR-王欣', 'wangxin@tencent.com', 'P3-5', '2025-09-20', 'IPO', '成熟期', 5, ARRAY['AI', '算法', '深度学习', '大厂'], '腾讯游戏AI和推荐算法需求旺盛', 9, 'active', '2025-01-15', '互联网', '3-5年', '本科'),
        ('阿里巴巴', '人工智能平台工程师', '杭州', '28-48k·16薪', 'HR-李华', 'lihua@alibaba-inc.com', 'P4-6', '2025-09-18', 'IPO', '成熟期', 5, ARRAY['AI', '平台', '云计算', '大厂'], '阿里云AI平台快速发展，技术人才紧缺', 9, 'active', '2025-01-15', '互联网', '3-5年', '本科');
        
        RAISE NOTICE 'Sample data inserted successfully';
    ELSE
        RAISE NOTICE 'Data already exists in opportunities table';
    END IF;

END $$;

-- 验证设置
SELECT 
    'Table exists' as check_type,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'opportunities') 
         THEN 'PASS' ELSE 'FAIL' END as result
UNION ALL
SELECT 
    'View exists' as check_type,
    CASE WHEN EXISTS (SELECT FROM information_schema.views WHERE table_name = 'opportunities_enhanced_view') 
         THEN 'PASS' ELSE 'FAIL' END as result
UNION ALL
SELECT 
    'Data exists' as check_type,
    CASE WHEN (SELECT COUNT(*) FROM public.opportunities) > 0 
         THEN 'PASS' ELSE 'FAIL' END as result;
