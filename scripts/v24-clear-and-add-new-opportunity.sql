-- 清空现有机会数据
TRUNCATE TABLE public.opportunities RESTART IDENTITY CASCADE;

-- 确保表结构包含所需字段
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS salary_range TEXT,
  ADD COLUMN IF NOT EXISTS job_type TEXT,
  ADD COLUMN IF NOT EXISTS experience_required TEXT,
  ADD COLUMN IF NOT EXISTS education_required TEXT,
  ADD COLUMN IF NOT EXISTS job_description TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS application_deadline TEXT,
  ADD COLUMN IF NOT EXISTS posted_date TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS priority INTEGER,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 插入新的工作机会数据
INSERT INTO public.opportunities
  (company_name, job_title, location, salary_range, job_type, experience_required, education_required, job_description, company_size, industry, benefits, status, tags, priority, source, posted_date)
VALUES
  -- 上海缠山科技有限公司
  ('上海缠山科技有限公司', 'AI产品经理', '成都青羊区成都·都成未来摩里中心15楼1505B', '7-12K', '全职', '不限', '本科', 
  '毕业时间：不限 

要求双一流大学的本科或硕士 
岗位职责： 
1. 深度追踪全球AI技术前沿动态，包括但不限于大型语言模型（LLM）的演进、Agent架构（规划、记忆、工具使用、多Agent协作）、AI推理优化、具身智能、人-Agent交互等。 
2. 分析顶级会议论文（NeurIPS, ICML, ICLR, ACL等）、开源项目、行业巨头及创新公司的技术突破和产品实践。 
3. 形成深刻的技术洞察报告，评估其产品化潜力和市场影响。 
4. 基于前沿研究，构思和定义具有突破性的AI Agent产品概念、应用场景和核心功能。 
5. 深入探索Agent的自主性、个性化、长期目标达成、复杂任务处理、多模态交互等关键能力在产品中的实现路径。 
6. 与AI研究科学家、工程师紧密合作，评估前沿技术在产品化中的可行性、风险和资源需求。 
7. 推动快速原型（Prototype）和概念验证（PoC）的开发，验证创新想法的技术路径和用户价值。 
8. 为公司在AI Agent等前沿领域制定中长期的创新产品战略和技术路线图。 
9. 识别高潜力的研究方向和技术投资机会。 
10. 向高层领导清晰阐述前沿趋势、创新机会和战略建议。 
11. 作为连接技术前沿与产品落地的桥梁，与研发、设计、市场等团队深度协作。 
12. 向工程团队清晰传达复杂的技术概念和产品愿景。 
任职要求： 
1. 对AI技术有深入理解，能够独立分析和评估前沿AI研究。 
2. 熟悉AI相关会议（如NeurIPS, ICML, ICLR, ACL等），能够紧跟技术动态。 
3. 具备跨学科合作能力，能与不同团队有效沟通。 
4. 富有创新精神，能够基于前沿研究提出新的产品概念和应用场景。 
5. 有能力进行快速原型制作和概念验证，以评估技术的可行性和市场潜力。 
6. 对产品设计和用户体验有一定的理解，能够提出符合用户需求的产品建议。 
7. 具备良好的分析和问题解决能力，能够准确评估项目风险和资源需求。',
  '中小企', '初创期', '五险一金、弹性工作、定期团建、节日福利、年终奖金', 'active', ARRAY['AI', '产品经理', '前沿技术', 'Agent'], 8, 'official', '2023-12-15');