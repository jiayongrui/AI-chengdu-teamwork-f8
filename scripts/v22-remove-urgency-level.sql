-- 删除 urgency_level 列并更新相关视图
-- v22: Remove urgency_level column

-- 1. 删除现有视图
DROP VIEW IF EXISTS opportunities_enhanced_view;

-- 2. 删除 urgency_level 列
ALTER TABLE opportunities DROP COLUMN IF EXISTS urgency_level;

-- 3. 重新创建视图（不包含 urgency_level）
CREATE VIEW opportunities_enhanced_view AS
SELECT 
    id,
    company_name,
    job_title,
    location,
    funding_stage,
    job_level,
    tags,
    reason,
    contact_email,
    contact_person,
    company_logo,
    priority,
    created_at,
    updated_at,
    expires_at,
    is_active
FROM opportunities
WHERE is_active = true
ORDER BY priority DESC, created_at DESC;

-- 4. 更新统计信息（移除 urgency_level 相关统计）
-- 这个函数现在返回 high_priority_opportunities 而不是 urgent_opportunities
CREATE OR REPLACE FUNCTION get_opportunity_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_opportunities', (SELECT COUNT(*) FROM opportunities),
        'active_opportunities', (SELECT COUNT(*) FROM opportunities WHERE is_active = true),
        'high_priority_opportunities', (SELECT COUNT(*) FROM opportunities WHERE is_active = true AND priority >= 8),
        'expiring_soon', (SELECT COUNT(*) FROM opportunities WHERE is_active = true AND expires_at <= NOW() + INTERVAL '7 days'),
        'unique_companies', (SELECT COUNT(DISTINCT company_name) FROM opportunities WHERE is_active = true)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON opportunities(priority);
CREATE INDEX IF NOT EXISTS idx_opportunities_active ON opportunities(is_active);
CREATE INDEX IF NOT EXISTS idx_opportunities_expires ON opportunities(expires_at);

-- 验证更改
SELECT 'urgency_level column removed successfully' as status;
