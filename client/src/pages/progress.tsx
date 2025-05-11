import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BarChart2, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  ArrowUpRight,
  AlertCircle,
  Award,
  Target
} from "lucide-react";
import { useUserProgress } from '@/hooks/useUserProgress';
import { useTargetRole } from '@/contexts/TargetRoleContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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

export default function ProgressPage({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use our global target role context
  const { targetRole, setTargetRole } = useTargetRole();
  
  // Use useUserProgress hook to get progress data with mutations
  const { 
    data: progressData, 
    isLoading, 
    error,
    markAsCompletedMutation,
    removeCompletionMutation 
  } = useUserProgress(user.id);
  
  // Fetch learning resources
  const { data: resources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['/api/learning-resources'],
  });
  
  // Fetch learning paths
  const { data: learningPaths, isLoading: isLoadingPaths } = useQuery<Array<{
    id: number;
    title: string;
    description: string;
    userId: number;
    targetRoleId?: number;
    status: string;
    progress: number;
    modules: Array<any>;
  }>>({
    queryKey: [`/api/users/${user.id}/learning-paths`],
  });
  
  // Fetch current career goal
  const { data: currentCareerGoal, isLoading: isLoadingCurrentGoal } = useQuery<{
    id: number;
    title: string;
    userId: number;
    targetRoleId?: number;
  }>({
    queryKey: ['/api/users/career-goals/current'],
  });
  
  // Fetch user skills
  const { data: userSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: [`/api/users/${user.id}/skills`],
  });
  
  // Sync the target role data with the context when progress data is loaded
  useEffect(() => {
    // Only update if progressData exists, is not loading, and contains targetRole data
    if (progressData?.targetRole && !isLoading && progressData.targetRole.id) {
      // Compare with current targetRole to avoid unnecessary updates
      if (!targetRole || targetRole.id !== progressData.targetRole.id) {
        console.log("[DEBUG] Syncing targetRole from progress data:", progressData.targetRole);
        setTargetRole(progressData.targetRole);
      }
    }
  // Only depend on progressData.targetRole?.id and isLoading, not the entire objects
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressData?.targetRole?.id, isLoading]);

  const isLoadingAll = isLoading || isLoadingResources || isLoadingPaths || isLoadingSkills || isLoadingCurrentGoal;
  
  if (isLoadingAll) {
    return (
      <div className="space-y-4 p-6">
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
      <Card className="border-destructive m-6">
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

  if (!progressData || !progressData.skills || progressData.skills.length === 0) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle>No Progress Data</CardTitle>
          <CardDescription>
            Start learning to see your progress here!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>You haven&apos;t started any learning resources yet. Begin your learning journey to track your progress.</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const chartData = progressData.skills.map(skill => ({
    name: skill.skillName,
    completed: skill.percent,
    remaining: 100 - skill.percent,
  }));

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Learning Progress</h2>
        <p className="text-gray-600">Track your skill development journey and learning achievements.</p>
      </div>
      
      {targetRole && (
        <div className="flex items-center p-4 mb-6 bg-muted/30 rounded-lg border border-muted">
          <Target className="h-5 w-5 text-primary mr-3" />
          <div>
            <span className="text-sm text-muted-foreground">Progress Tracking For:</span>
            <h3 className="text-lg font-semibold">{targetRole.title}</h3>
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Overall Progress Card */}
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold flex items-center">
                <Target className="mr-2 h-6 w-6 text-primary" />
                Overall Progress
              </CardTitle>
              <CardDescription>
                Your journey toward {targetRole ? `your ${targetRole.title} role` : 'your career goal'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm font-medium">{progressData.overallPercent}%</span>
                </div>
                <Progress value={progressData.overallPercent} className="h-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Skills in Progress</p>
                      <p className="text-xl font-bold">{progressData.skills.length}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Resources</p>
                      <p className="text-xl font-bold">
                        {progressData.skills.reduce((total, skill) => total + skill.completed, 0)} / 
                        {progressData.skills.reduce((total, skill) => total + skill.total, 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Top Skill</p>
                      <p className="text-xl font-bold">
                        {progressData.skills.length > 0 ? progressData.skills[0].skillName : 'None'}
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
                {progressData.skills.slice(0, 3).map((skill) => (
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
          {/* Skills Header */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-primary" />
                Skills Progress for {targetRole ? targetRole.title : 'Current Career Goal'}
              </CardTitle>
              <CardDescription>
                Track your development in key skills required for {targetRole ? `the ${targetRole.title} role` : 'your career goal'}
              </CardDescription>
            </CardHeader>
          </Card>
          
          {/* Skills Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progressData.skills.map((skill) => (
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
                Skills Progress for {targetRole ? targetRole.title : 'Current Goal'}
              </CardTitle>
              <CardDescription>
                Visual breakdown of your skills progress toward {targetRole ? `the ${targetRole.title} role` : 'your career goal'}
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
                      formatter={(value: number) => [`${value}%`, 'Completion'] as [string, string]}
                      labelFormatter={(label: string) => `Skill: ${label}`}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" key="progress-stats-summary">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {progressData.skills.reduce((total, skill) => total + skill.total, 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">
                  {progressData.skills.reduce((total, skill) => total + skill.completed, 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {progressData.overallPercent}%
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Learning Paths Progress */}
          {learningPaths && Array.isArray(learningPaths) && learningPaths.length > 0 && currentCareerGoal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  Learning Path Progress
                </CardTitle>
                <CardDescription>
                  Progress in your learning paths for {targetRole ? targetRole.title : (currentCareerGoal ? currentCareerGoal.title : 'Current Goal')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {learningPaths.map((path) => {
                    if (!path.modules || typeof path.modules !== 'object') {
                      return null;
                    }
                    
                    // Parse modules if it's a string
                    const moduleData = typeof path.modules === 'string' 
                      ? JSON.parse(path.modules)
                      : path.modules;
                      
                    // Get array of modules
                    const modules = Array.isArray(moduleData) ? moduleData : [];
                    
                    // Calculate path completion
                    const totalPathResources = modules.reduce(
                      (total: number, module: any) => {
                        return total + (Array.isArray(module.resources) ? module.resources.length : 0);
                      }, 
                      0
                    );
                    
                    const completedPathResources = modules.reduce(
                      (total: number, module: any) => {
                        if (!Array.isArray(module.resources)) return total;
                        return total + module.resources.filter((r: any) => r.completed).length;
                      }, 
                      0
                    );
                    
                    const pathCompletionPercentage = totalPathResources > 0 
                      ? Math.round((completedPathResources / totalPathResources) * 100) 
                      : 0;
                    
                    return (
                      <div key={path.id}>
                        <div className="flex justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{path.title}</h4>
                            <p className="text-xs text-gray-500">
                              {completedPathResources} of {totalPathResources} resources completed
                            </p>
                          </div>
                          <span className="text-sm font-medium">{pathCompletionPercentage}%</span>
                        </div>
                        <Progress value={pathCompletionPercentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
