import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserProgress, ProgressStats } from '@/hooks/useUserProgress';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  Award, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertCircle,
  Edit
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from '@/components/ui/button';
import { queryClient } from '@/lib/queryClient';

interface ProgressTabProps {
  userId: number;
}

const ProgressTab: React.FC<ProgressTabProps> = ({ userId }) => {
  const { 
    data: progressStats, 
    isLoading, 
    error,
    markAsCompletedMutation,
    removeCompletionMutation 
  } = useUserProgress(userId);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="w-5 h-5 mr-2" />
            Error Loading Progress Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>We encountered an error while loading your progress data. Please try again later.</p>
          <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!progressStats || !progressStats.skills || progressStats.skills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Progress Data</CardTitle>
          <CardDescription>
            Start learning to see your progress here!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>You haven't started any learning resources yet. Begin your learning journey to track your progress.</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const chartData = progressStats.skills.map(skill => ({
    name: skill.skillName,
    completed: skill.percent,
    remaining: 100 - skill.percent,
  }));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Overall Progress Card */}
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold flex items-center">
                <Target className="mr-2 h-6 w-6 text-primary" />
                Overall Progress
              </CardTitle>
              <CardDescription>
                Your journey toward your career goal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm font-medium">{progressStats.overallPercent}%</span>
                </div>
                <Progress value={progressStats.overallPercent} className="h-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Skills in Progress</p>
                      <p className="text-xl font-bold">{progressStats.skills.length}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Resources</p>
                      <p className="text-xl font-bold">
                        {progressStats.skills.reduce((total, skill) => total + skill.completed, 0)} / 
                        {progressStats.skills.reduce((total, skill) => total + skill.total, 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Top Skill</p>
                      <p className="text-xl font-bold">
                        {progressStats.skills.length > 0 ? progressStats.skills[0].skillName : 'None'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressStats.skills.slice(0, 3).map((skill) => (
                  <div key={skill.skillId} className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{skill.skillName}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {skill.completed} of {skill.total} resources completed
                        </span>
                        <span className="text-xs font-medium">{skill.percent}%</span>
                      </div>
                      <Progress value={skill.percent} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="skills" className="space-y-4">
          {/* Skills Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progressStats.skills.map((skill) => (
              <HoverCard key={skill.skillId}>
                <HoverCardTrigger asChild>
                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold">{skill.skillName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm font-medium">{skill.percent}%</span>
                        </div>
                        <Progress value={skill.percent} className="h-2" />
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                          <span>{skill.completed} completed</span>
                          <span>{skill.total - skill.completed} remaining</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">{skill.skillName} Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium">{skill.completed} resources</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium">{skill.total} resources</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completion</p>
                        <p className="font-medium">{skill.percent}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">
                          {skill.percent === 100 ? (
                            <span className="text-green-500">Completed</span>
                          ) : skill.percent > 50 ? (
                            <span className="text-amber-500">In Progress</span>
                          ) : (
                            <span className="text-blue-500">Started</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Skills Progress Chart
              </CardTitle>
              <CardDescription>
                Visual breakdown of your skills progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Completion']}
                      labelFormatter={(label) => `Skill: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                    <Bar dataKey="remaining" name="Remaining" stackId="a" fill="#e5e7eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Progress Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {progressStats.skills.reduce((total, skill) => total + skill.total, 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">
                  {progressStats.skills.reduce((total, skill) => total + skill.completed, 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {progressStats.overallPercent}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressTab;