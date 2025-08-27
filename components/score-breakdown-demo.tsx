import React from 'react';
import ScoreBreakdown from './score-breakdown';

const ScoreBreakdownDemo: React.FC = () => {
  // 示例数据
  const sampleScoreData = [
    { "dimension": "背景与经验", "score": 85, "weight": 19 },
    { "dimension": "专业知识与技能", "score": 90, "weight": 20 },
    { "dimension": "产品作品与成果", "score": 78, "weight": 26 },
    { "dimension": "核心胜任力", "score": 65, "weight": 15 },
    { "dimension": "发展潜力", "score": 92, "weight": 12 },
    { "dimension": "企业认知与匹配", "score": 45, "weight": 8 }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">评分详情组件演示</h1>
      <ScoreBreakdown scoreData={sampleScoreData} />
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">使用说明</h2>
        <p className="text-gray-600 mb-2">
          ScoreBreakdown 组件接收一个 scoreData 数组，每个对象包含：
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li><code className="bg-gray-200 px-1 rounded">dimension</code>: 评分维度名称</li>
          <li><code className="bg-gray-200 px-1 rounded">score</code>: 得分 (0-100)</li>
          <li><code className="bg-gray-200 px-1 rounded">weight</code>: 权重百分比</li>
        </ul>
        <p className="text-gray-600 mt-3">
          颜色说明：
          <span className="inline-block w-3 h-3 bg-green-500 rounded ml-2 mr-1"></span>优秀 (≥80分)
          <span className="inline-block w-3 h-3 bg-yellow-500 rounded ml-2 mr-1"></span>良好 (60-79分)
          <span className="inline-block w-3 h-3 bg-red-500 rounded ml-2 mr-1"></span>待提升 (<60分)
        </p>
      </div>
    </div>
  );
};

export default ScoreBreakdownDemo;