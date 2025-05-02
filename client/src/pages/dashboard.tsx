import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import StatCard from "@/components/dashboard/StatCard";
import CareerGoals from "@/components/dashboard/CareerGoals";
import LearningPath from "@/components/dashboard/LearningPath";
import RecentActivity from "@/components/dashboard/RecentActivity";
import AiCoach from "@/components/dashboard/AiCoach";
import SmartSkillGraph from "@/components/dashboard/SmartSkillGraph";
import LearningPatternAnalysis from "@/components/dashboard/LearningPatternAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, PanelLeft, Eye, EyeOff, BarChart2, Route, Briefcase } from "lucide-react";
import { useCareerGoal } from "@/contexts/CareerGoalContext";
import { queryClient } from "@/lib/queryClient";
import { LearningResource } from "@shared/schema";

// Define dashboard data types
interface DashboardData {
  user: {
    id: number;
    name: string;
    greeting?: string;
  };
  stats: {
    overallProgress: number;
    skillsValidated: string;
    learningTime: string;
    resourcesCompleted: string;
  };
  careerGoal?: {
    id: number;
    title: string;
    timeline: string;
    readiness: number;
  };
  keySkills?: Array<{
    name: string;
    status?: string;
    percentage?: number;
    [key: string]: any;
  }>;
  learningPath?: {
    title: string;
    modules: any[];
  };
  recentActivities: any[];
}

export default function Dashboard({ user }: { user: any }) {
  const [showAiFeatures, setShowAiFeatures] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use our centralized career goal context
  const { currentGoal, targetRoleSkills, isLoading: isLoadingGoal } = useCareerGoal();
  
  const { data: dashboardData, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: [`/api/users/${user.id}/dashboard`],
    // Set a shorter staleTime to ensure we refetch data more frequently
    staleTime: 30000, // 30 seconds
  });
  
  // Effect to refetch dashboard data when component mounts or when currentGoal changes
  // This ensures we have fresh data after saving a career goal
  useEffect(() => {
    console.log("[DEBUG] Dashboard - Current goal changed, refetching data:", 
      currentGoal ? { id: currentGoal.id, title: currentGoal.title, targetRoleId: currentGoal.targetRoleId } : null
    );
    // Force a full refetch to ensure the latest data
    refetch();
    // Also invalidate the learning resources query since those may be role-specific
    queryClient.invalidateQueries({ queryKey: ['/api/learning-resources'] });
  }, [refetch, currentGoal, currentGoal?.id, currentGoal?.targetRoleId]);

  const { data: learningResources, isLoading: isLoadingResources } = useQuery<LearningResource[]>({
    queryKey: ['/api/learning-resources'],
  });

  if (isLoading || isLoadingResources || isLoadingGoal) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Greeting & Overview */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{dashboardData?.user?.greeting || `Hello, ${user.name.split(' ')[0]}!`}</h2>
          <p className="text-gray-600">Here's your skill development progress and recommended next steps.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <Button 
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.location.href = "/career-transitions"}
          >
            <PanelLeft className="h-4 w-4" />
            Explore Career Options
          </Button>
          
          {dashboardData?.careerGoal && (
            <Button 
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.location.href = "/career-plan"}
            >
              <Route className="h-4 w-4" />
              View Career Plan
            </Button>
          )}
          
          <Button 
            variant={showAiFeatures ? "default" : "outline"} 
            size="sm" 
            className="gap-2"
            onClick={() => setShowAiFeatures(!showAiFeatures)}
          >
            {showAiFeatures ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showAiFeatures ? "Hide AI Features" : "Show AI Features"}
          </Button>
          
          {!showAiFeatures && (
            <div className="hidden md:flex">
              <AiCoach userId={user.id} />
            </div>
          )}
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Overall Progress" 
          value={`${dashboardData?.stats?.overallProgress || 0}%`} 
          type="progress" 
        />
        <StatCard 
          title="Skills Validated" 
          value={dashboardData?.stats?.skillsValidated || "0 / 0"} 
          type="validated" 
        />
        <StatCard 
          title="Learning Time" 
          value={dashboardData?.stats?.learningTime || "0 hours"} 
          type="time" 
        />
        <StatCard 
          title="Resources Completed" 
          value={dashboardData?.stats?.resourcesCompleted || "0 / 0"} 
          type="resources" 
        />
      </div>
      
      {/* AI Coach - Shown only in compact mode when showAiFeatures is true */}
      {showAiFeatures && (
        <div className="mb-8">
          <AiCoach userId={user.id} />
        </div>
      )}
      
      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showAiFeatures && <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </TabsTrigger>}
        </TabsList>
        
        <TabsContent value="overview" className="pt-6">
          {/* Career Goals - Now full width and prominent, using CareerGoalContext */}
          <div className="mb-8">
            {currentGoal ? (
              <CareerGoals 
                id={currentGoal.id}
                title={currentGoal.title}
                timeline={`${currentGoal.timelineMonths} months`}
                readiness={dashboardData?.careerGoal?.readiness || 40}
                skills={dashboardData?.keySkills || (Array.isArray(targetRoleSkills) ? targetRoleSkills.map(skill => ({ name: skill })) : [])}
              />
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-primary/10 rounded-xl shadow-md p-8 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Set Your Career Goal</h2>
                <p className="text-gray-600 mb-6 max-w-2xl">Define your target role to get personalized skill development recommendations and a tailored learning path</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-6">
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <div className="text-primary text-xl font-bold mb-1">1.</div>
                    <h3 className="font-medium mb-2">Assess your skills</h3>
                    <p className="text-sm text-gray-500">Evaluate your current skill levels across various domains</p>
                  </div>
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <div className="text-primary text-xl font-bold mb-1">2.</div>
                    <h3 className="font-medium mb-2">Define your target role</h3>
                    <p className="text-sm text-gray-500">Select or create a custom career transition goal</p>
                  </div>
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <div className="text-primary text-xl font-bold mb-1">3.</div>
                    <h3 className="font-medium mb-2">Follow your learning path</h3>
                    <p className="text-sm text-gray-500">Get a personalized roadmap to achieve your goal</p>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = "/assessment"} 
                  className="px-6 py-6 rounded-full"
                >
                  Get Started Now →
                </Button>
              </div>
            )}
          </div>
          
          {/* Debug info section */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-xs text-gray-400 mb-4">
              <div>Debug - Context Goal: {currentGoal?.title || 'not set'} (ID: {currentGoal?.id || 'none'})</div>
              <div>Debug - Context Target Role ID: {currentGoal?.targetRoleId || 'not set'} (type: {typeof currentGoal?.targetRoleId})</div>
              <div>Debug - Context Skills: {targetRoleSkills.join(', ') || 'none'}</div>
              <div>Debug - API Goal: {dashboardData?.careerGoal?.title || 'not set'} (ID: {dashboardData?.careerGoal?.id || 'none'})</div>
            </div>
          )}
          
          {/* Learning Path */}
          {dashboardData?.learningPath && (
            <div className="mb-8">
              <LearningPath 
                title={dashboardData.learningPath.title}
                modules={dashboardData.learningPath.modules}
                resources={learningResources ? learningResources.map(resource => ({
                  ...resource,
                  // Ensure required fields exist with fallback values for null
                  description: resource.description || 'No description available',
                  resourceType: resource.resourceType || 'unknown',
                  duration: resource.duration || 60,
                })) : []}
              />
            </div>
          )}
          
          {/* Recent Activity */}
          <RecentActivity activities={dashboardData?.recentActivities || []} />
        </TabsContent>
        
        {showAiFeatures && (
          <TabsContent value="ai" className="pt-6">
            {/* AI-Powered Features */}
            <div className="grid grid-cols-1 gap-8">
              {/* Smart Skill Graph */}
              <div>
                <SmartSkillGraph userId={user.id} />
              </div>
              
              {/* Learning Pattern Analysis */}
              <div>
                <LearningPatternAnalysis userId={user.id} />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
