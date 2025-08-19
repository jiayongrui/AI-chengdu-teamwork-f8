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

-- 插入新的工作机会数据（参照BOSS直聘样式）
INSERT INTO public.opportunities
  (company_name, job_title, location, salary_range, job_type, experience_required, education_required, job_description, company_size, industry, benefits, contact_email, contact_person, status, tags, priority, source, posted_date)
VALUES
  -- 1. 字节跳动
  ('字节跳动', '前端开发工程师', '北京', '25K-50K', '全职', '3-5年', '本科', 
  '岗位职责：
1. 负责字节跳动旗下产品的Web前端开发，包括PC端和移动端；
2. 与产品、设计和后端工程师紧密协作，打造优质的用户体验；
3. 持续优化前端性能，提升用户体验和页面加载速度；
4. 参与技术方案设计，解决技术难题。

岗位要求：
1. 计算机相关专业本科及以上学历，3年以上前端开发经验；
2. 精通HTML/CSS/JavaScript，熟悉ES6+特性；
3. 熟练掌握React或Vue等主流前端框架，了解其原理；
4. 熟悉前端工程化，如Webpack、Vite等构建工具；
5. 有良好的代码风格和编程习惯，注重代码质量；
6. 有大型Web应用开发经验者优先；
7. 有开源项目贡献经验者优先。',
  '10000人以上', '互联网', '六险一金、免费三餐、定期体检、节日福利、团队旅游', 'hr@bytedance.com', '张经理', 'active', ARRAY['前端开发', 'React', 'Vue', 'JavaScript'], 9, 'official', '2023-12-01'),
  
  -- 2. 阿里巴巴
  ('阿里巴巴', '后端开发工程师', '杭州', '30K-60K', '全职', '5-10年', '本科', 
  '岗位职责：
1. 负责阿里巴巴电商平台后端系统的设计和开发；
2. 参与系统架构设计，保证系统的高可用性和可扩展性；
3. 解决高并发、大数据量的技术挑战；
4. 优化系统性能，提升用户体验。

岗位要求：
1. 计算机相关专业本科及以上学历，5年以上后端开发经验；
2. 精通Java/Go等编程语言，熟悉Spring Boot、Spring Cloud等框架；
3. 熟悉分布式系统设计，了解微服务架构；
4. 熟悉MySQL、Redis等数据库和缓存技术；
5. 具备良好的问题分析和解决能力；
6. 有大型电商平台开发经验者优先；
7. 有高并发系统设计经验者优先。',
  '10000人以上', '互联网', '六险一金、股票期权、免费班车、餐补、健身房', 'talent@alibaba.com', '李总监', 'active', ARRAY['后端开发', 'Java', 'Go', '微服务'], 8, 'official', '2023-12-05'),
  
  -- 3. 腾讯
  ('腾讯', '产品经理', '深圳', '25K-45K', '全职', '3-5年', '本科', 
  '岗位职责：
1. 负责腾讯社交产品的需求分析、功能规划和产品设计；
2. 与设计师、开发工程师紧密合作，推动产品从概念到上线；
3. 收集用户反馈，持续优化产品体验；
4. 分析产品数据，提出改进方案。

岗位要求：
1. 本科及以上学历，3年以上互联网产品经理经验；
2. 对用户体验和产品设计有深刻理解；
3. 具备良好的沟通能力和团队协作精神；
4. 熟悉产品开发流程，能够独立负责产品从需求到上线的全过程；
5. 有社交产品或工具类产品经验者优先；
6. 有数据分析能力，能够基于数据做决策。',
  '10000人以上', '互联网', '六险一金、年终奖、弹性工作、免费健身', 'pm@tencent.com', '王产品总监', 'active', ARRAY['产品经理', '社交产品', '用户体验'], 8, 'official', '2023-12-10'),
  
  -- 4. 百度
  ('百度', 'AI算法工程师', '北京', '35K-70K', '全职', '3-8年', '硕士', 
  '岗位职责：
1. 负责百度AI相关产品的算法研发和优化；
2. 设计和实现机器学习模型，解决实际业务问题；
3. 参与前沿AI技术研究，推动技术创新；
4. 与产品团队合作，将AI技术应用到实际产品中。

岗位要求：
1. 计算机、人工智能相关专业硕士及以上学历；
2. 3年以上AI算法相关工作经验；
3. 精通深度学习、机器学习算法，熟悉TensorFlow、PyTorch等框架；
4. 具备良好的算法设计和优化能力；
5. 有NLP、计算机视觉或推荐系统经验者优先；
6. 有顶级会议论文发表经验者优先。',
  '10000人以上', '互联网', '六险一金、弹性工作、免费班车、餐补、健身房', 'ai@baidu.com', '张博士', 'active', ARRAY['AI', '机器学习', '深度学习', 'Python'], 9, 'official', '2023-12-15'),
  
  -- 5. 美团
  ('美团', '数据分析师', '北京', '20K-35K', '全职', '2-4年', '本科', 
  '岗位职责：
1. 负责美团业务数据的分析和挖掘，提供决策支持；
2. 建立数据分析模型，发现业务问题和机会；
3. 设计和实现数据可视化报表，展示业务洞察；
4. 与产品、运营团队合作，优化业务流程。

岗位要求：
1. 统计学、数学、计算机等相关专业本科及以上学历；
2. 2年以上数据分析相关工作经验；
3. 精通SQL，熟练使用Python/R等数据处理工具；
4. 熟悉数据可视化工具，如Tableau、PowerBI等；
5. 具备良好的数据敏感度和业务理解能力；
6. 有电商或O2O行业数据分析经验者优先。',
  '10000人以上', '互联网', '六险一金、餐补、弹性工作、定期体检', 'data@meituan.com', '刘经理', 'active', ARRAY['数据分析', 'SQL', 'Python', '数据可视化'], 7, 'official', '2023-12-20'),
  
  -- 6. 京东
  ('京东', '供应链管理专家', '北京', '30K-50K', '全职', '5-10年', '本科', 
  '岗位职责：
1. 负责京东物流供应链系统的规划和优化；
2. 设计和实施供应链解决方案，提升物流效率；
3. 分析供应链数据，发现问题并提出改进方案；
4. 与各业务部门合作，优化库存管理和配送流程。

岗位要求：
1. 物流、供应链管理相关专业本科及以上学历；
2. 5年以上电商物流或供应链管理经验；
3. 熟悉供应链管理理论和实践，了解物流行业最新趋势；
4. 具备良好的数据分析能力和问题解决能力；
5. 有大型电商平台供应链管理经验者优先；
6. 有供应链优化项目经验者优先。',
  '10000人以上', '电子商务', '六险一金、股票期权、年终奖、带薪年假', 'supply@jd.com', '赵总监', 'active', ARRAY['供应链', '物流', '库存管理', '电商'], 8, 'official', '2023-12-25'),
  
  -- 7. 网易
  ('网易', '游戏策划', '杭州', '18K-35K', '全职', '2-5年', '本科', 
  '岗位职责：
1. 负责网易游戏的玩法设计、关卡设计和数值平衡；
2. 撰写详细的游戏设计文档，指导开发实现；
3. 参与游戏测试，收集反馈并持续优化游戏体验；
4. 研究市场上的优秀游戏，提出创新玩法。

岗位要求：
1. 本科及以上学历，2年以上游戏策划经验；
2. 热爱游戏，对游戏设计有深刻理解；
3. 具备良好的文档写作能力和沟通能力；
4. 有创意思维和解决问题的能力；
5. 有已上线游戏策划经验者优先；
6. 有RPG或MMORPG游戏策划经验者优先。',
  '10000人以上', '游戏', '六险一金、年终奖、带薪年假、免费三餐', 'game@netease.com', '陈策划总监', 'active', ARRAY['游戏策划', '游戏设计', 'RPG', '关卡设计'], 7, 'official', '2024-01-05'),
  
  -- 8. 小米
  ('小米', '硬件工程师', '北京', '25K-45K', '全职', '3-6年', '本科', 
  '岗位职责：
1. 负责小米智能硬件产品的电路设计和开发；
2. 参与产品从概念到量产的全过程；
3. 解决硬件开发过程中的技术问题；
4. 与软件团队协作，确保软硬件协同工作。

岗位要求：
1. 电子工程、通信工程等相关专业本科及以上学历；
2. 3年以上消费电子产品硬件开发经验；
3. 精通电路设计，熟悉常用电子元器件；
4. 熟悉PCB设计和布局，了解EMC设计规范；
5. 具备良好的问题分析和解决能力；
6. 有智能家居或可穿戴设备开发经验者优先。',
  '10000人以上', '消费电子', '六险一金、股票期权、免费班车、餐补', 'hardware@xiaomi.com', '杨工程师', 'active', ARRAY['硬件开发', '电路设计', 'PCB设计', '智能硬件'], 8, 'official', '2024-01-10'),
  
  -- 9. 滴滴
  ('滴滴出行', '数据科学家', '北京', '35K-60K', '全职', '5-8年', '硕士', 
  '岗位职责：
1. 负责滴滴出行的大数据分析和挖掘，构建预测模型；
2. 设计和实现机器学习算法，优化派单和定价系统；
3. 分析用户行为数据，提升用户体验和平台效率；
4. 与产品和工程团队合作，将数据洞察转化为产品功能。

岗位要求：
1. 计算机、统计学等相关专业硕士及以上学历；
2. 5年以上数据科学或机器学习相关工作经验；
3. 精通Python/R等数据分析工具，熟悉SQL和大数据处理技术；
4. 熟悉常用机器学习算法和深度学习框架；
5. 具备良好的数据敏感度和业务理解能力；
6. 有交通或出行行业数据分析经验者优先。',
  '10000人以上', '出行服务', '六险一金、弹性工作、免费班车、餐补', 'data@didiglobal.com', '周博士', 'active', ARRAY['数据科学', '机器学习', 'Python', '大数据'], 9, 'official', '2024-01-15'),
  
  -- 10. 华为
  ('华为', '5G网络工程师', '深圳', '30K-50K', '全职', '3-8年', '本科', 
  '岗位职责：
1. 负责华为5G网络设备的设计和开发；
2. 参与5G标准研究和技术创新；
3. 解决网络设备开发过程中的技术难题；
4. 与客户沟通，了解需求并提供技术支持。

岗位要求：
1. 通信工程、电子工程等相关专业本科及以上学历；
2. 3年以上通信网络设备开发经验；
3. 熟悉5G网络架构和协议，了解无线通信原理；
4. 具备良好的编程能力，熟悉C/C++；
5. 有良好的团队合作精神和沟通能力；
6. 有电信设备开发经验者优先；
7. 有3GPP标准参与经验者优先。',
  '10000人以上', '通信设备', '六险一金、年终奖、免费班车、住房补贴', 'telecom@huawei.com', '吴工程师', 'active', ARRAY['5G', '通信', '网络设备', 'C++'], 8, 'official', '2024-01-20');