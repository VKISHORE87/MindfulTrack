import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, BookOpen, Clock, BarChart, CalendarDays, Lightbulb } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LearningPatternAnalysis as LearningPatternType } from '@/lib/openai';

interface LearningPatternAnalysisProps {
  userId: number;
}

export default function LearningPatternAnalysis({ userId }: LearningPatternAnalysisProps) {
  const [activeTab, setActiveTab] = useState('times');
  
  const { data, isLoading, isError, refetch } = useQuery<LearningPatternType>({
    queryKey: [`/api/users/${userId}/learning-pattern-analysis`],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle>Learning Pattern Analysis</CardTitle>
          <CardDescription>
            Analyzing your learning habits and preferences...
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <RefreshCw className="h-10 w-10 animate-spin text-primary opacity-70" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle>Learning Pattern Analysis</CardTitle>
          <CardDescription>
            We need more learning data to analyze your patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center">
          <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-center text-gray-500 mb-4">
            Complete more learning modules to unlock personalized insights
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Learning Pattern Analysis</CardTitle>
            <CardDescription>
              AI-powered insights to optimize your learning strategy
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="times" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="times" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Optimal Times</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              <span>Content Types</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="times" className="space-y-4">
            <div className="relative overflow-x-auto rounded-lg border">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Day</th>
                    <th scope="col" className="px-4 py-3">Time Range</th>
                    <th scope="col" className="px-4 py-3">Effectiveness</th>
                  </tr>
                </thead>
                <tbody>
                  {data.optimalLearningTimes.map((time, index) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        {time.dayOfWeek}
                      </td>
                      <td className="px-4 py-3">{time.timeRange}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={time.effectiveness * 100} className="h-2" />
                          <span className="text-xs font-medium">{Math.round(time.effectiveness * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 italic">
              These are your most productive learning times based on your past activity.
            </p>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.contentTypeEffectiveness.map((content, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{content.type}</h4>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {Math.round(content.effectiveness * 100)}% effective
                    </span>
                  </div>
                  <Progress value={content.effectiveness * 100} className="h-2 mb-3" />
                  <p className="text-sm text-gray-600">{content.recommendation}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Session Insights
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-gray-600">Optimal Duration:</span>
                    <span className="font-medium">{data.learningSessionInsights.optimalDuration} minutes</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Break Frequency:</span>
                    <span className="font-medium">Every {data.learningSessionInsights.breakFrequency} minutes</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Sessions Before Fatigue:</span>
                    <span className="font-medium">{data.learningSessionInsights.focusMetrics.averageSessionsBeforeFatigue}</span>
                  </li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-primary" />
                  Skill Acquisition
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 mb-2">You learn fastest in these areas:</p>
                  {data.skillAcquisitionRate.fastestForSkillTypes.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="font-medium">{skill.category}</span>
                      <span className="text-xs text-gray-500">
                        ({skill.rate > 0.7 ? 'Fast' : skill.rate > 0.4 ? 'Moderate' : 'Gradual'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Recommendations</h4>
              <p className="text-sm text-gray-700">
                {data.skillAcquisitionRate.recommendations}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}