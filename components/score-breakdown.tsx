import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ScoreData {
  dimension: string;
  score: number;
  weight: number;
}

interface ScoreBreakdownProps {
  scoreData: ScoreData[];
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scoreData }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          评分详情
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scoreData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {item.dimension}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  权重: {item.weight}%
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {item.score}分
                </span>
              </div>
            </div>
            <div className="relative">
              <Progress 
                value={item.score} 
                className="h-2"
              />
              <div 
                className={`absolute top-0 left-0 h-2 rounded-full transition-all ${
                  item.score >= 80 ? 'bg-green-500' : 
                  item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ScoreBreakdown;