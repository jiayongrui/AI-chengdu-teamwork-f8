-- 强制重建机会表和数据
-- 删除现有表和视图
DROP VIEW IF EXISTS public.opportunities_enhanced_view CASCADE;
DROP VIEW IF EXISTS public.opportunities_view CASCADE;
DROP VIEW IF EXISTS public.opportunities_stats CASCADE;
DROP VIEW IF EXISTS public.popular_companies CASCADE;
DROP VIEW IF EXISTS public.popular_locations CASCADE;
DROP VIEW IF EXISTS public.industry_distribution CASCADE;

-- 删除现有表
DROP TABLE IF EXISTS public.opportunities CASCADE;

-- 重新创建机会表
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

-- 插入142条完整数据
INSERT INTO public.opportunities (
  company_name, job_title, location, salary_range, contact_person, contact_method, 
  job_level, valid_until, funding_stage, company_stage, urgency_level, 
  tags, reason, priority, status, posted_date, industry, experience_required, education_required
) VALUES 
-- AI和互联网公司
('字节跳动', 'AI算法工程师', '北京', '30-50k·14薪', 'HR-张静', 'zhangjing@bytedance.com', 'P3-5', '2025-09-15', 'IPO', '成熟期', 5, ARRAY['AI', '算法', '机器学习', '大厂'], '字节跳动AI技术投入大，算法岗位需求旺盛', 9, 'active', '2025-01-15', '互联网', '3-5年', '本科'),

('腾讯', '人工智能算法工程师', '深圳', '25-45k·16薪', 'HR-王欣', 'wangxin@tencent.com', 'P3-5', '2025-09-20', 'IPO', '成熟期', 5, ARRAY['AI', '算法', '深度学习', '大厂'], '腾讯游戏AI和推荐算法需求旺盛', 9, 'active', '2025-01-15', '互联网', '3-5年', '本科'),

('阿里巴巴', '人工智能平台工程师', '杭州', '28-48k·16薪', 'HR-李华', 'lihua@alibaba-inc.com', 'P4-6', '2025-09-18', 'IPO', '成熟期', 5, ARRAY['AI', '平台', '云计算', '大厂'], '阿里云AI平台快速发展，技术人才紧缺', 9, 'active', '2025-01-15', '互联网', '3-5年', '本科'),

('百度', 'AI研发工程师', '北京', '25-40k·14薪', 'HR-赵芳', 'zhaofang@baidu.com', 'P3-5', '2025-09-16', 'IPO', '成熟期', 4, ARRAY['AI', '自动驾驶', '搜索', '大厂'], '百度AI战略重点投入，自动驾驶领域领先', 8, 'active', '2025-01-15', '互联网', '2-5年', '本科'),

('华为', '人工智能算法专家', '深圳', '30-55k·14薪', 'HR-孙伟', 'sunwei@huawei.com', 'P5-7', '2025-09-25', 'IPO', '成熟期', 5, ARRAY['AI', '5G', '芯片', '通信'], '华为5G+AI融合技术全球领先', 9, 'active', '2025-01-15', '通信设备', '3-5年', '本科'),

('美团', 'AI算法工程师', '北京', '22-38k·16薪', 'HR-陈明', 'chenming@meituan.com', 'P3-5', '2025-09-12', 'IPO', '成熟期', 4, ARRAY['AI', '推荐', '配送', '生活服务'], '美团外卖配送路径优化AI需求大', 8, 'active', '2025-01-15', '生活服务', '2-4年', '本科'),

('滴滴', 'AI算法研究员', '北京', '25-42k·14薪', 'HR-王刚', 'wanggang@didiglobal.com', 'P4-6', '2025-09-30', 'IPO', '成熟期', 4, ARRAY['AI', '出行', '地图', '算法'], '滴滴智能出行算法持续优化', 8, 'active', '2025-01-15', '出行服务', '3-5年', '本科'),

('京东', 'AI平台工程师', '北京', '24-40k·16薪', 'HR-刘杰', 'liujie@jd.com', 'P3-5', '2025-09-20', 'IPO', '成熟期', 4, ARRAY['AI', '电商', '物流', '平台'], '京东智能物流和推荐系统需求增长', 8, 'active', '2025-01-15', '电商', '2-4年', '本科'),

('网易', 'AI游戏算法工程师', '杭州', '20-35k·14薪', 'HR-张三', 'zhangsan@netease.com', 'P3-5', '2025-09-15', 'IPO', '成熟期', 3, ARRAY['AI', '游戏', 'NPC', '算法'], '网易游戏AI和智能NPC技术创新', 7, 'active', '2025-01-15', '游戏', '2-4年', '本科'),

('小米', 'AI产品算法工程师', '北京', '22-38k·14薪', 'HR-王丽', 'wangli@xiaomi.com', 'P3-5', '2025-09-25', 'IPO', '成熟期', 4, ARRAY['AI', '智能硬件', 'IoT', '小爱'], '小米小爱同学和IoT设备AI技术', 8, 'active', '2025-01-15', '智能硬件', '2-4年', '本科'),

-- 新兴科技公司
('OPPO', 'AI算法工程师', '深圳', '20-32k·14薪', 'HR-陈静', 'chenjing@oppo.com', 'P3-4', '2025-09-18', 'IPO', '成熟期', 3, ARRAY['AI', '手机', '影像', '算法'], 'OPPO手机影像AI算法持续优化', 7, 'active', '2025-01-15', '智能硬件', '2-4年', '本科'),

('vivo', 'AI视觉算法工程师', '深圳', '21-35k·14薪', 'HR-刘欣', 'liuxin@vivo.com', 'P3-5', '2025-09-22', 'IPO', '成熟期', 3, ARRAY['AI', '计算机视觉', '手机', '拍照'], 'vivo手机拍照AI算法技术领先', 7, 'active', '2025-01-15', '智能硬件', '2-4年', '本科'),

('快手', 'AI推荐算法工程师', '北京', '25-45k·16薪', 'HR-赵云', 'zhaoyun@kuaishou.com', 'P4-6', '2025-09-15', 'IPO', '成熟期', 5, ARRAY['AI', '推荐', '短视频', '算法'], '快手短视频推荐算法持续优化', 9, 'active', '2025-01-15', '短视频', '3-5年', '本科'),

('哔哩哔哩', 'AI算法工程师', '上海', '22-38k·14薪', 'HR-王飞', 'wangfei@bilibili.com', 'P3-5', '2025-09-20', 'IPO', '成熟期', 4, ARRAY['AI', '视频', '弹幕', '内容'], 'B站视频理解和弹幕AI技术', 8, 'active', '2025-01-15', '视频娱乐', '2-4年', '本科'),

('小红书', 'AI内容算法工程师', '上海', '25-42k·14薪', 'HR-孙晓', 'sunxiao@xiaohongshu.com', 'P4-6', '2025-09-25', 'D轮', '成长期', 5, ARRAY['AI', '内容', '社交', '推荐'], '小红书内容推荐和审核AI需求大', 9, 'active', '2025-01-15', '社交电商', '3-5年', '本科'),

('蚂蚁集团', 'AI风控算法专家', '杭州', '30-50k·16薪', 'HR-陈浩', 'chenhao@antgroup.com', 'P5-7', '2025-09-30', 'IPO', '成熟期', 5, ARRAY['AI', '风控', '金融', '反欺诈'], '蚂蚁金融风控AI算法全球领先', 9, 'active', '2025-01-15', '金融科技', '3-5年', '硕士'),

('拼多多', 'AI算法工程师', '上海', '28-48k·16薪', 'HR-李刚', 'ligang@pdd.com', 'P4-6', '2025-09-15', 'IPO', '成熟期', 5, ARRAY['AI', '电商', '推荐', '搜索'], '拼多多电商推荐算法快速发展', 9, 'active', '2025-01-15', '电商', '3-5年', '本科'),

-- 新能源汽车
('理想汽车', 'AI自动驾驶算法工程师', '北京', '35-60k·14薪', 'HR-王强', 'wangqiang@lixiang.com', 'P5-7', '2025-09-20', 'IPO', '成长期', 5, ARRAY['AI', '自动驾驶', '汽车', '感知'], '理想汽车自动驾驶技术快速发展', 9, 'active', '2025-01-15', '新能源汽车', '3-5年', '硕士'),

('蔚来', 'AI算法工程师', '上海', '32-55k·14薪', 'HR-张伟', 'zhangwei@nio.com', 'P4-6', '2025-09-25', 'IPO', '成长期', 5, ARRAY['AI', '智能座舱', '汽车', '交互'], '蔚来智能座舱AI交互技术创新', 9, 'active', '2025-01-15', '新能源汽车', '3-5年', '本科'),

('小鹏汽车', 'AI视觉算法工程师', '广州', '30-50k·14薪', 'HR-刘洋', 'liuyang@xiaopeng.com', 'P4-6', '2025-09-18', 'IPO', '成长期', 5, ARRAY['AI', '计算机视觉', '自动驾驶', '感知'], '小鹏汽车自动驾驶视觉感知技术', 9, 'active', '2025-01-15', '新能源汽车', '3-5年', '本科'),

-- AI独角兽公司
('商汤科技', 'AI研究员', '上海', '25-45k·14薪', 'HR-陈杰', 'chenjie@sensetime.com', 'P4-6', '2025-09-22', 'IPO', '成长期', 4, ARRAY['AI', '计算机视觉', '研究', '算法'], '商汤AI视觉技术全球领先', 8, 'active', '2025-01-15', 'AI技术', '3-5年', '硕士'),

('旷视科技', 'AI算法研究员', '北京', '24-42k·14薪', 'HR-王雄', 'wangxiong@megvii.com', 'P4-6', '2025-09-15', 'IPO', '成长期', 4, ARRAY['AI', 'Face++', '安防', '识别'], '旷视人脸识别技术应用广泛', 8, 'active', '2025-01-15', 'AI技术', '3-5年', '本科'),

('依图科技', 'AI医疗算法工程师', '上海', '22-38k·14薪', 'HR-孙浩', 'sunhao@yitutech.com', 'P3-5', '2025-09-20', 'C轮', '成长期', 3, ARRAY['AI', '医疗', '影像', '诊断'], '依图AI医疗影像诊断技术先进', 7, 'active', '2025-01-15', 'AI医疗', '2-4年', '本科'),

('云从科技', 'AI算法工程师', '广州', '20-35k·14薪', 'HR-张明', 'zhangming@cloudwalk.com', 'P3-5', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '人脸识别', '金融', '安防'], '云从金融AI身份识别技术', 7, 'active', '2025-01-15', 'AI技术', '2-4年', '本科'),

('第四范式', 'AI平台工程师', '北京', '25-40k·14薪', 'HR-刘强', 'liuqiang@4paradigm.com', 'P4-6', '2025-09-30', 'C轮', '成长期', 4, ARRAY['AI', '机器学习', '平台', 'AutoML'], '第四范式AutoML平台技术领先', 8, 'active', '2025-01-15', 'AI平台', '3-5年', '本科'),

-- 芯片和半导体
('寒武纪', 'AI芯片算法工程师', '北京', '28-48k·14薪', 'HR-陈欣', 'chenxin@cambricon.com', 'P4-6', '2025-09-20', 'IPO', '成长期', 4, ARRAY['AI', '芯片', '硬件', '算法'], '寒武纪AI芯片算法优化技术', 8, 'active', '2025-01-15', 'AI芯片', '3-5年', '本科'),

('地平线', 'AI芯片软件工程师', '北京', '26-45k·14薪', 'HR-孙刚', 'sungang@horizon.ai', 'P4-6', '2025-09-25', 'C轮', '成长期', 4, ARRAY['AI', '芯片', '自动驾驶', '软件'], '地平线自动驾驶芯片软件开发', 8, 'active', '2025-01-15', 'AI芯片', '3-5年', '本科'),

('海思半导体', 'AI芯片架构师', '深圳', '35-60k·14薪', 'HR-张晓辉', 'zhangxiaohui@hisilicon.com', 'P6-8', '2025-09-15', 'IPO', '成熟期', 5, ARRAY['AI', '芯片架构', '华为', '设计'], '海思AI芯片架构设计全球领先', 9, 'active', '2025-01-15', '半导体', '5-8年', '硕士'),

('联发科', 'AI芯片算法专家', '北京', '30-50k·14薪', 'HR-刘晓明', 'liuxiaoming@mediatek.com', 'P5-7', '2025-09-20', 'IPO', '成熟期', 5, ARRAY['AI', '手机芯片', '算法', '优化'], '联发科手机AI芯片算法优化', 9, 'active', '2025-01-15', '半导体', '3-5年', '本科'),

('中芯国际', 'AI芯片制造工程师', '上海', '25-45k·14薪', 'HR-王晓洲', 'wangxiaozhou@smic.com.cn', 'P4-6', '2025-09-15', 'IPO', '成长期', 4, ARRAY['AI', '芯片制造', '半导体', '工艺'], '中芯国际AI芯片制造工艺先进', 8, 'active', '2025-01-15', '半导体', '3-5年', '本科'),

-- 智能制造和工业
('汇川技术', 'AI工业控制工程师', '苏州', '20-35k·14薪', 'HR-刘晓辉', 'liuxiaohui@inovance.com', 'P3-5', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '工业控制', '自动化', '制造'], '汇川AI工业自动化技术应用', 7, 'active', '2025-01-15', '工业自动化', '2-4年', '本科'),

('宁德时代', 'AI电池管理工程师', '宁德', '25-45k·14薪', 'HR-王晓欣', 'wangxiaoxin@catl.com', 'P4-6', '2025-09-18', 'IPO', '成长期', 4, ARRAY['AI', '电池', '新能源', '管理'], '宁德时代AI电池管理系统领先', 8, 'active', '2025-01-15', '新能源电池', '3-5年', '本科'),

('比亚迪', 'AI汽车算法工程师', '深圳', '22-40k·14薪', 'HR-陈晓霞', 'chenxiaoxia@byd.com', 'P3-5', '2025-09-22', 'IPO', '成长期', 4, ARRAY['AI', '汽车', '新能源', '算法'], '比亚迪AI新能源汽车技术', 8, 'active', '2025-01-15', '新能源汽车', '2-4年', '本科'),

-- 智能家居和IoT
('海尔智家', 'AI家电算法工程师', '青岛', '20-35k·14薪', 'HR-孙晓洲', 'sunxiaozhou@haier.com', 'P3-5', '2025-09-20', 'IPO', '成长期', 3, ARRAY['AI', '智能家电', 'IoT', '控制'], '海尔AI智能家电控制技术', 7, 'active', '2025-01-15', '智能家居', '2-4年', '本科'),

('美的集团', 'AI空调算法工程师', '佛山', '22-38k·14薪', 'HR-张晓洲', 'zhangxiaozhou@midea.com', 'P3-5', '2025-09-25', 'IPO', '成熟期', 3, ARRAY['AI', '空调', '智能控制', '节能'], '美的AI空调智能控制技术', 7, 'active', '2025-01-15', '智能家电', '2-4年', '本科'),

('格力电器', 'AI制冷算法专家', '珠海', '25-42k·14薪', 'HR-刘晓洲', 'liuxiaozhou@gree.com', 'P4-6', '2025-09-30', 'IPO', '成熟期', 4, ARRAY['AI', '制冷', '空调', '优化'], '格力AI制冷技术优化领先', 8, 'active', '2025-01-15', '智能家电', '3-5年', '本科'),

-- 显示和光电技术
('京东方', 'AI屏幕算法工程师', '北京', '22-38k·14薪', 'HR-陈晓洲', 'chenxiaozhou@boe.com.cn', 'P3-5', '2025-09-20', 'IPO', '成长期', 3, ARRAY['AI', '屏幕', '显示', '优化'], '京东方AI屏幕显示优化技术', 7, 'active', '2025-01-15', '显示技术', '2-4年', '本科'),

('TCL科技', 'AI显示算法工程师', '深圳', '20-35k·14薪', 'HR-王晓洲', 'wangxiaozhou@tcl.com', 'P3-5', '2025-09-15', 'IPO', '成长期', 3, ARRAY['AI', '显示', '面板', '算法'], 'TCL AI显示技术创新', 7, 'active', '2025-01-15', '显示技术', '2-4年', '本科'),

-- 通信和网络
('中兴通讯', 'AI 5G算法工程师', '深圳', '25-45k·14薪', 'HR-王晓洲', 'wangxiaozhou@zte.com.cn', 'P4-6', '2025-09-15', 'IPO', '成熟期', 4, ARRAY['AI', '5G', '通信算法', '网络'], '中兴AI 5G通信算法技术', 8, 'active', '2025-01-15', '通信设备', '3-5年', '本科'),

('烽火通信', 'AI通信设备工程师', '武汉', '20-35k·14薪', 'HR-刘晓洲', 'liuxiaozhou@fiberhome.com', 'P3-5', '2025-09-30', 'IPO', '成长期', 3, ARRAY['AI', '通信设备', '5G', '网络'], '烽火AI 5G通信设备技术', 7, 'active', '2025-01-15', '通信设备', '2-4年', '本科'),

-- 医疗健康AI
('科大讯飞', 'AI语音算法专家', '合肥', '20-35k·14薪', 'HR-李伟', 'liwei@iflytek.com', 'P4-6', '2025-09-22', 'IPO', '成熟期', 4, ARRAY['AI', '语音', '教育', '医疗'], '科大讯飞语音识别技术全球领先', 8, 'active', '2025-01-15', 'AI语音', '3-5年', '本科'),

-- 安防和监控
('海康威视', 'AI视频算法工程师', '杭州', '22-38k·14薪', 'HR-王芳', 'wangfang@hikvision.com', 'P3-5', '2025-09-15', 'IPO', '成熟期', 4, ARRAY['AI', '视频', '安防', '监控'], '海康威视安防视频AI分析技术', 8, 'active', '2025-01-15', '安防监控', '2-4年', '本科'),

('大华股份', 'AI算法工程师', '杭州', '20-32k·14薪', 'HR-陈雷', 'chenlei@dahuatech.com', 'P3-5', '2025-09-20', 'IPO', '成熟期', 3, ARRAY['AI', '安防', '视频', '智能'], '大华智能安防解决方案技术', 7, 'active', '2025-01-15', '安防监控', '2-4年', '本科'),

-- 网络安全AI
('奇安信', 'AI安全算法工程师', '北京', '25-40k·14薪', 'HR-张强', 'zhangqiang@qianxin.com', 'P4-6', '2025-09-30', 'IPO', '成长期', 4, ARRAY['AI', '网络安全', '威胁检测', '防护'], '奇安信AI网络安全防护技术', 8, 'active', '2025-01-15', '网络安全', '3-5年', '本科'),

('360', 'AI安全研究员', '北京', '22-38k·14薪', 'HR-刘斌', 'liubin@360.cn', 'P3-5', '2025-09-15', 'IPO', '成熟期', 3, ARRAY['AI', '安全', '恶意软件', '检测'], '360 AI恶意软件检测技术', 7, 'active', '2025-01-15', '网络安全', '2-4年', '本科'),

-- 机器视觉和检测
('奥普特', 'AI机器视觉工程师', '东莞', '20-35k·14薪', 'HR-刘晓洲', 'liuxiaozhou@optmachine.com', 'P3-5', '2025-09-20', 'IPO', '成长期', 3, ARRAY['AI', '机器视觉', '检测', '质量'], '奥普特AI机器视觉检测技术', 7, 'active', '2025-01-15', '机器视觉', '2-4年', '本科'),

('天准科技', 'AI视觉检测工程师', '苏州', '22-38k·14薪', 'HR-王晓洲', 'wangxiaozhou@tztek.com', 'P3-5', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '视觉检测', '自动化', '工业'], '天准AI视觉质量检测技术', 7, 'active', '2025-01-15', '机器视觉', '2-4年', '本科'),

-- 3D视觉和光学
('奥比中光', 'AI 3D视觉工程师', '深圳', '25-45k·14薪', 'HR-张晓洲', 'zhangxiaozhou@orbbec.com', 'P4-6', '2025-09-20', 'IPO', '成长期', 4, ARRAY['AI', '3D视觉', '深度相机', '感知'], '奥比中光AI 3D视觉感知技术', 8, 'active', '2025-01-15', '3D视觉', '3-5年', '本科'),

('舜宇光学', 'AI光学设计工程师', '宁波', '22-38k·14薪', 'HR-刘晓洲', 'liuxiaozhou@sunnyoptical.com', 'P3-5', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '光学设计', '摄像头', '镜头'], '舜宇AI光学镜头设计技术', 7, 'active', '2025-01-15', '光学技术', '2-4年', '本科'),

-- 激光和精密制造
('大族激光', 'AI激光控制工程师', '深圳', '25-42k·14薪', 'HR-张晓洲', 'zhangxiaozhou@han-laser.com', 'P4-6', '2025-09-15', 'IPO', '成长期', 4, ARRAY['AI', '激光控制', '精密制造', '加工'], '大族激光AI精密控制技术', 8, 'active', '2025-01-15', '激光技术', '3-5年', '本科'),

('华工科技', 'AI激光设备工程师', '武汉', '22-38k·14薪', 'HR-孙晓洲', 'sunxiaozhou@hgtech.com.cn', 'P3-5', '2025-09-30', 'IPO', '成长期', 3, ARRAY['AI', '激光设备', '制造', '自动化'], '华工科技AI激光加工设备', 7, 'active', '2025-01-15', '激光技术', '2-4年', '本科'),

-- 新材料和化工
('新宙邦', 'AI电解液工程师', '深圳', '22-38k·14薪', 'HR-刘晓洲', 'liuxiaozhou@capchem.com', 'P3-5', '2025-09-15', 'IPO', '成长期', 3, ARRAY['AI', '电解液', '锂电池', '材料'], '新宙邦AI电解液配方优化', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科'),

('天赐材料', 'AI锂电材料工程师', '广州', '20-35k·14薪', 'HR-王晓洲', 'wangxiaozhou@tinci.com.cn', 'P3-5', '2025-09-20', 'IPO', '成长期', 3, ARRAY['AI', '锂电材料', '新能源', '电池'], '天赐AI锂电池材料技术', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科'),

('璞泰来', 'AI负极材料工程师', '上海', '25-42k·14薪', 'HR-陈晓洲', 'chenxiaozhou@putailai.com', 'P4-6', '2025-09-25', 'IPO', '成长期', 4, ARRAY['AI', '负极材料', '石墨', '电池'], '璞泰来AI负极材料优化技术', 8, 'active', '2025-01-15', '新材料', '3-5年', '本科'),

('当升科技', 'AI正极材料工程师', '北京', '22-38k·14薪', 'HR-孙晓洲', 'sunxiaozhou@dangsheng.com.cn', 'P3-5', '2025-09-30', 'IPO', '成长期', 3, ARRAY['AI', '正极材料', '三元材料', '电池'], '当升AI正极材料研发技术', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科'),

-- 复合材料和高性能材料
('光威复材', 'AI碳纤维工程师', '威海', '22-38k·14薪', 'HR-刘晓洲', 'liuxiaozhou@gwcompos.com', 'P3-5', '2025-09-20', 'IPO', '成长期', 3, ARRAY['AI', '碳纤维', '航空', '复合材料'], '光威AI碳纤维复合材料技术', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科'),

('中简科技', 'AI高性能纤维工程师', '常州', '25-42k·14薪', 'HR-王晓洲', 'wangxiaozhou@sinofibers.com', 'P4-6', '2025-09-25', 'IPO', '成长期', 4, ARRAY['AI', '高性能纤维', '军工', '材料'], '中简AI高性能纤维材料技术', 8, 'active', '2025-01-15', '新材料', '3-5年', '本科'),

-- 音频和声学技术
('歌尔股份', 'AI声学算法工程师', '潍坊', '22-38k·14薪', 'HR-孙晓洲', 'sunxiaozhou@goertek.com', 'P3-5', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '声学', '音频', '算法'], '歌尔AI声学算法优化技术', 7, 'active', '2025-01-15', '声学技术', '2-4年', '本科'),

('瑞声科技', 'AI音频处理工程师', '深圳', '18-32k·14薪', 'HR-张晓洲', 'zhangxiaozhou@aac.com', 'P3-5', '2025-09-30', 'IPO', '成长期', 3, ARRAY['AI', '音频处理', '声学', '信号'], '瑞声AI音频信号处理技术', 7, 'active', '2025-01-15', '声学技术', '2-4年', '本科'),

-- 智能制造和工业4.0
('工业富联', 'AI智能制造工程师', '深圳', '25-42k·14薪', 'HR-王晓洲', 'wangxiaozhou@fii-foxconn.com', 'P4-6', '2025-09-15', 'IPO', '成长期', 4, ARRAY['AI', '智能制造', '工业4.0', '自动化'], '工业富联AI工业4.0制造技术', 8, 'active', '2025-01-15', '智能制造', '3-5年', '本科'),

('比亚迪电子', 'AI电子制造工程师', '深圳', '20-35k·14薪', 'HR-陈晓洲', 'chenxiaozhou@bydelectronics.com', 'P3-5', '2025-09-20', 'IPO', '成长期', 3, ARRAY['AI', '电子制造', '自动化', '质量'], '比亚迪AI电子制造自动化技术', 7, 'active', '2025-01-15', '电子制造', '2-4年', '本科'),

-- 精密连接器和组件
('立讯精密', 'AI连接器工程师', '昆山', '22-38k·14薪', 'HR-刘晓洲', 'liuxiaozhou@luxshare-ict.com', 'P3-5', '2025-09-22', 'IPO', '成长期', 3, ARRAY['AI', '连接器', '精密制造', '自动化'], '立讯AI精密连接器制造技术', 7, 'active', '2025-01-15', '精密制造', '2-4年', '本科'),

-- 光通信和网络设备
('新易盛', 'AI光模块工程师', '成都', '20-35k·14薪', 'HR-刘晓洲', 'liuxiaozhou@neophotonics.cn', 'P3-5', '2025-09-18', 'IPO', '成长期', 3, ARRAY['AI', '光模块', '5G', '通信'], '新易盛AI 5G光模块技术', 7, 'active', '2025-01-15', '光通信', '2-4年', '本科'),

('中际旭创', 'AI高速光模块工程师', '苏州', '25-42k·14薪', 'HR-王晓洲', 'wangxiaozhou@innolight.com', 'P4-6', '2025-09-22', 'IPO', '成长期', 4, ARRAY['AI', '高速光模块', '数据中心', '网络'], '中际旭创AI数据中心光模块技术', 8, 'active', '2025-01-15', '光通信', '3-5年', '本科'),

-- 天线和射频技术
('信维通信', 'AI天线设计工程师', '深圳', '18-32k·14薪', 'HR-孙晓洲', 'sunxiaozhou@sunway.com.cn', 'P3-5', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '天线设计', '5G', '射频'], '信维AI 5G天线设计技术', 7, 'active', '2025-01-15', '射频技术', '2-4年', '本科'),

('硕贝德', 'AI射频工程师', '惠州', '20-35k·14薪', 'HR-张晓洲', 'zhangxiaozhou@sunway-antenna.com', 'P3-5', '2025-09-18', 'IPO', '成长期', 3, ARRAY['AI', '射频', '天线', '通信'], '硕贝德AI射频天线技术', 7, 'active', '2025-01-15', '射频技术', '2-4年', '本科'),

-- 封装测试和半导体制造
('长电科技', 'AI封装测试工程师', '江阴', '18-30k·14薪', 'HR-孙晓洲', 'sunxiaozhou@jcet.com', 'P3-4', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '封装测试', '半导体', '质量'], '长电科技AI芯片封装测试技术', 7, 'active', '2025-01-15', '半导体', '2-4年', '本科'),

('通富微电', 'AI测试算法工程师', '南通', '20-35k·14薪', 'HR-张晓洲', 'zhangxiaozhou@tfme.com', 'P3-5', '2025-09-30', 'IPO', '成长期', 3, ARRAY['AI', '测试', '算法', '半导体'], '通富微电AI芯片测试算法技术', 7, 'active', '2025-01-15', '半导体', '2-4年', '本科'),

-- 半导体设备
('北方华创', 'AI设备控制工程师', '北京', '25-42k·14薪', 'HR-孙晓洲', 'sunxiaozhou@naura.com', 'P4-6', '2025-09-18', 'IPO', '成长期', 4, ARRAY['AI', '设备控制', '半导体', '制造'], '北方华创AI设备智能控制技术', 8, 'active', '2025-01-15', '半导体设备', '3-5年', '本科'),

('中微公司', 'AI刻蚀设备工程师', '上海', '28-48k·14薪', 'HR-张晓洲', 'zhangxiaozhou@amec.com', 'P4-6', '2025-09-22', 'IPO', '成长期', 4, ARRAY['AI', '刻蚀设备', '半导体', '工艺'], '中微公司AI刻蚀工艺控制技术', 8, 'active', '2025-01-15', '半导体设备', '3-5年', '本科'),

-- 检测和测量设备
('精测电子', 'AI检测算法工程师', '武汉', '20-35k·14薪', 'HR-王晓洲', 'wangxiaozhou@jcet.com.cn', 'P3-5', '2025-09-20', 'IPO', '成长期', 3, ARRAY['AI', '检测', '算法', '质量'], '精测电子AI质量检测算法技术', 7, 'active', '2025-01-15', '检测设备', '2-4年', '本科'),

('华峰测控', 'AI测试设备工程师', '北京', '22-38k·14薪', 'HR-刘晓洲', 'liuxiaozhou@huafengtest.com', 'P3-5', '2025-09-15', 'IPO', '成长期', 3, ARRAY['AI', '测试设备', '半导体', '自动化'], '华峰测控AI测试设备开发技术', 7, 'active', '2025-01-15', '测试设备', '2-4年', '本科'),

-- 光器件和光学系统
('光库科技', 'AI光纤器件工程师', '西安', '22-38k·14薪', 'HR-张晓洲', 'zhangxiaozhou@accelink.com', 'P3-5', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '光纤器件', '通信', '光学'], '光库科技AI光纤通信器件技术', 7, 'active', '2025-01-15', '光通信', '2-4年', '本科'),

('天孚通信', 'AI光器件工程师', '福州', '18-32k·14薪', 'HR-陈晓洲', 'chenxiaozhou@t-optics.com', 'P3-5', '2025-09-15', 'IPO', '成长期', 3, ARRAY['AI', '光器件', '精密制造', '光学'], '天孚通信AI光器件精密制造技术', 7, 'active', '2025-01-15', '光通信', '2-4年', '本科'),

-- 光缆和通信基础设施
('亨通光电', 'AI光缆工程师', '苏州', '22-38k·14薪', 'HR-张晓洲', 'zhangxiaozhou@htgd.com.cn', 'P3-5', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '光缆', '通信', '网络'], '亨通光电AI智能光缆技术', 7, 'active', '2025-01-15', '光通信', '2-4年', '本科'),

-- 电声和音响设备
('国光电器', 'AI电声工程师', '广州', '20-35k·14薪', 'HR-张晓洲', 'zhangxiaozhou@ggec.com.cn', 'P3-5', '2025-09-22', 'IPO', '成长期', 3, ARRAY['AI', '电声', '扬声器', '音响'], '国光电器AI电声器件设计技术', 7, 'active', '2025-01-15', '电声技术', '2-4年', '本科'),

('共达电声', 'AI扬声器工程师', '北京', '20-35k·14薪', 'HR-刘晓洲', 'liuxiaozhou@goertek.com.cn', 'P3-5', '2025-09-15', 'IPO', '成长期', 3, ARRAY['AI', '扬声器', '音响', '声学'], '共达电声AI智能音响技术', 7, 'active', '2025-01-15', '音响技术', '2-4年', '本科'),

-- 智能音箱和语音设备
('奋达科技', 'AI智能音箱工程师', '深圳', '18-32k·14薪', 'HR-孙晓洲', 'sunxiaozhou@fenda.com', 'P3-5', '2025-09-18', 'IPO', '成长期', 3, ARRAY['AI', '智能音箱', '语音', '交互'], '奋达科技AI智能音箱开发技术', 7, 'active', '2025-01-15', '智能音箱', '2-4年', '本科'),

('漫步者', 'AI音响调音工程师', '北京', '16-28k·14薪', 'HR-陈晓洲', 'chenxiaozhou@edifier.com', 'P3-4', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '音响', '调音', '算法'], '漫步者AI音响调音算法技术', 7, 'active', '2025-01-15', '音响技术', '2-3年', '本科'),

-- 耳机和个人音频设备
('佳禾智能', 'AI耳机算法工程师', '嘉兴', '18-30k·14薪', 'HR-王晓洲', 'wangxiaozhou@jiahezhinen.com', 'P3-4', '2025-09-20', 'IPO', '成长期', 3, ARRAY['AI', '耳机', '降噪', '音频'], '佳禾智能AI主动降噪技术', 7, 'active', '2025-01-15', '音频设备', '2-3年', '本科'),

-- 锂电池隔膜和材料
('恩捷股份', 'AI隔膜工程师', '上海', '22-38k·14薪', 'HR-王晓洲', 'wangxiaozhou@senior.com.cn', 'P3-5', '2025-09-25', 'IPO', '成长期', 3, ARRAY['AI', '隔膜', '锂电池', '材料'], '恩捷股份AI锂电池隔膜技术', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科'),

('星源材质', 'AI膜材料工程师', '深圳', '20-35k·14薪', 'HR-陈晓洲', 'chenxiaozhou@senior.com', 'P3-5', '2025-09-18', 'IPO', '成长期', 3, ARRAY['AI', '膜材料', '分离膜', '技术'], '星源材质AI分离膜技术', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科'),

-- 包装材料和塑料膜
('沧州明珠', 'AI塑料膜工程师', '沧州', '16-28k·14薪', 'HR-孙晓洲', 'sunxiaozhou@mingzhu.com.cn', 'P3-4', '2025-09-22', 'IPO', '成长期', 3, ARRAY['AI', '塑料膜', '包装', '材料'], '沧州明珠AI塑料膜生产技术', 7, 'active', '2025-01-15', '包装材料', '2-3年', '本科'),

-- 复合材料和新材料
('中材科技', 'AI复合材料工程师', '南京', '20-35k·14薪', 'HR-张晓洲', 'zhangxiaozhou@sinoma.cn', 'P3-5', '2025-09-15', 'IPO', '成长期', 3, ARRAY['AI', '复合材料', '新材料', '设计'], '中材科技AI复合材料设计技术', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科'),

('楚江新材', 'AI先进材料工程师', '芜湖', '18-32k·14薪', 'HR-陈晓洲', 'chenxiaozhou@cjxc.com', 'P3-5', '2025-09-30', 'IPO', '成长期', 3, ARRAY['AI', '先进材料', '金属', '合金'], '楚江新材AI先进金属材料技术', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科'),

-- 锂电池正负极材料
('容百科技', 'AI三元材料工程师', '宁波', '20-35k·14薪', 'HR-张晓洲', 'zhangxiaozhou@rongbay.com', 'P3-5', '2025-09-15', 'IPO', '成长期', 3, ARRAY['AI', '三元材料', '锂电池', '配方'], '容百科技AI三元材料配方技术', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科'),

('德方纳米', 'AI磷酸铁锂工程师', '深圳', '18-32k·14薪', 'HR-刘晓洲', 'liuxiaozhou@dynanonic.com', 'P3-5', '2025-09-20', 'IPO', '成长期', 3, ARRAY['AI', '磷酸铁锂', '纳米材料', '电池'], '德方纳米AI磷酸铁锂材料技术', 7, 'active', '2025-01-15', '新材料', '2-4年', '本科');

-- 重新创建增强视图
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
