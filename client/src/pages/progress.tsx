import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart2, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  ArrowUpRight,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function ProgressPage({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch user progress
  const { data: userProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: [`/api/users/${user.id}/progress`],
  });
  
  // Fetch learning resources
  const { data: resources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['/api/learning-resources'],
  });
  
  // Fetch learning paths
  const { data: learningPaths, isLoading: isLoadingPaths } = useQuery({
    queryKey: [`/api/users/${user.id}/learning-paths`],
  });
  
  // Fetch current career goal
  const { data: currentCareerGoal, isLoading: isLoadingCurrentGoal } = useQuery({
    queryKey: ['/api/users/career-goals/current'],
  });
  
  // Fetch user skills
  const { data: userSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: [`/api/users/${user.id}/skills`],
  });
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: [`/api/users/${user.id}/dashboard`],
  });
  
  const isLoading = isLoadingProgress || isLoadingResources || isLoadingPaths || isLoadingSkills || isLoadingDashboard || isLoadingCurrentGoal;
  
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Calculate progress statistics
  const resourcesStarted = userProgress?.filter(p => p.progress > 0) || [];
  const resourcesCompleted = userProgress?.filter(p => p.completed) || [];
  const totalResources = resources?.length || 0;
  
  const completionPercentage = totalResources > 0 
    ? Math.round((resourcesCompleted.length / totalResources) * 100) 
    : 0;
  
  const totalLearningTimeMinutes = resourcesCompleted.reduce((total, progress) => {
    const resource = resources?.find(r => r.id === progress.resourceId);
    return total + (resource?.duration || 0);
  }, 0);
  
  const totalLearningTimeHours = Math.round(totalLearningTimeMinutes / 60);
  
  // Calculate skill progress
  const averageSkillProgress = userSkills?.length > 0
    ? Math.round(userSkills.reduce((sum, skill) => sum + (skill.currentLevel / skill.targetLevel * 100), 0) / userSkills.length)
    : 0;
  
  // Sort learning resources by completion date
  const completedResourcesByDate = [...(resourcesCompleted || [])].sort((a, b) => {
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });
  
  // Group resources by month for the progress chart
  const resourcesByMonth = resourcesCompleted.reduce((acc, progress) => {
    const date = new Date(progress.completedAt);
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = 0;
    }
    
    acc[monthYear]++;
    return acc;
  }, {} as Record<string, number>);
  
  const chartData = Object.entries(resourcesByMonth).map(([month, count]) => ({
    month,
    count
  }));

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Learning Progress</h2>
        <p className="text-gray-600">Track your skill development journey and learning achievements.</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 flex items-center">
                <div className="p-3 rounded-full bg-primary-100 text-primary mr-4">
                  <BarChart2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overall Progress</p>
                  <p className="text-xl font-bold">{dashboardData?.stats?.overallProgress || 0}%</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-emerald-500 mr-4">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Resources Completed</p>
                  <p className="text-xl font-bold">{resourcesCompleted.length} / {totalResources}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 flex items-center">
                <div className="p-3 rounded-full bg-amber-100 text-amber-500 mr-4">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Learning Time</p>
                  <p className="text-xl font-bold">{totalLearningTimeHours} hours</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Skill Progress</p>
                  <p className="text-xl font-bold">{averageSkillProgress}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Progress Over Time</h3>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-64">
                    <div className="h-full flex items-end justify-between">
                      {chartData.map((data, i) => (
                        <div key={i} className="flex flex-col items-center h-full justify-end flex-1">
                          <div className="relative w-full px-2 flex justify-center mb-2">
                            <div 
                              className="bg-primary rounded-t-md w-8"
                              style={{ height: `${Math.min(100, data.count * 20)}%` }}
                            ></div>
                            <div className="absolute -top-6 text-xs font-medium">{data.count}</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                            {data.month}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No progress data available yet</p>
                    <p className="text-sm text-gray-400">Complete resources to see your progress chart</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Path Completion</h3>
              </CardHeader>
              <CardContent>
                {learningPaths && learningPaths.length > 0 ? (
                  <div className="space-y-6">
                    {learningPaths.map((path) => {
                      // Calculate path completion
                      const totalPathResources = path.modules.reduce(
                        (total, module) => total + module.resources.length, 
                        0
                      );
                      
                      const completedPathResources = path.modules.reduce(
                        (total, module) => {
                          return total + module.resources.filter(r => r.completed).length;
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
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No learning paths available</p>
                    <p className="text-sm text-gray-400">Generate a path to start tracking your progress</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Resource Progress</h3>
            </CardHeader>
            <CardContent>
              {resourcesStarted.length > 0 ? (
                <div className="space-y-6">
                  {resourcesStarted.map((progress) => {
                    const resource = resources?.find(r => r.id === progress.resourceId);
                    if (!resource) return null;
                    
                    return (
                      <div key={progress.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex gap-4 mb-2">
                          <div className={`h-10 w-10 rounded flex items-center justify-center flex-shrink-0
                            ${resource.resourceType === 'course' || resource.resourceType === 'video' ? 'bg-blue-100' : ''}
                            ${resource.resourceType === 'workshop' ? 'bg-purple-100' : ''}
                            ${resource.resourceType === 'assessment' ? 'bg-green-100' : ''}
                            ${resource.resourceType !== 'course' && resource.resourceType !== 'video' && 
                              resource.resourceType !== 'workshop' && resource.resourceType !== 'assessment' ? 'bg-gray-100' : ''}
                          `}>
                            <BookOpen className={`h-5 w-5
                              ${resource.resourceType === 'course' || resource.resourceType === 'video' ? 'text-blue-600' : ''}
                              ${resource.resourceType === 'workshop' ? 'text-purple-600' : ''}
                              ${resource.resourceType === 'assessment' ? 'text-green-600' : ''}
                              ${resource.resourceType !== 'course' && resource.resourceType !== 'video' && 
                                resource.resourceType !== 'workshop' && resource.resourceType !== 'assessment' ? 'text-gray-600' : ''}
                            `} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{resource.title}</h4>
                              <span className="text-sm font-medium">{progress.progress}%</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">{resource.resourceType}</span>
                              {progress.completed && (
                                <span className="text-xs flex items-center text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </span>
                              )}
                            </div>
                            <Progress value={progress.progress} className="h-2 mt-2" />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Started: {new Date(progress.startedAt).toLocaleDateString()}</span>
                              {progress.completedAt && (
                                <span>Completed: {new Date(progress.completedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No resources started yet</h3>
                  <p className="text-gray-500">Start learning resources to track your progress here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Skill Progress</h3>
            </CardHeader>
            <CardContent>
              {userSkills && userSkills.length > 0 ? (
                <div className="space-y-6">
                  {userSkills.map((skill) => {
                    const percentage = Math.round((skill.currentLevel / skill.targetLevel) * 100);
                    
                    return (
                      <div key={skill.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <h4 className="font-medium">{skill.skillName}</h4>
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="capitalize">{skill.category}</span>
                              <span className="mx-2">•</span>
                              <span>Current: {skill.currentLevel}%</span>
                              <span className="mx-2">•</span>
                              <span>Target: {skill.targetLevel}%</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {skill.currentLevel > skill.currentLevel - 10 && (
                              <span className="text-xs flex items-center text-emerald-600 mr-2">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                Improving
                              </span>
                            )}
                            <span className="text-sm font-medium">{percentage}%</span>
                          </div>
                        </div>
                        <Progress 
                          value={percentage} 
                          className={`h-2 ${
                            percentage < 40 ? 'bg-red-100' : 
                            percentage < 70 ? 'bg-amber-100' : 
                            'bg-emerald-100'
                          }`}
                        />
                        <div className={`h-full w-[${percentage}%] ${
                          percentage < 40 ? 'bg-red-500' : 
                          percentage < 70 ? 'bg-amber-500' : 
                          'bg-emerald-500'
                        }`} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No skill data available</h3>
                  <p className="text-gray-500">Complete your skill assessment to track your progress here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
