import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Sparkles, Activity } from "lucide-react";

// New modular components
import ProgressTracker from "@/components/dashboard/ProgressTracker";
import SkillGapSummary from "@/components/dashboard/SkillGapSummary";
import NextStepsPanel from "@/components/dashboard/NextStepsPanel";
import CareerPathRecommendations from "@/components/dashboard/CareerPathRecommendations";
import LearningProgressSummary from "@/components/dashboard/LearningProgressSummary";
import AIRecommendationsPanel from "@/components/dashboard/AIRecommendationsPanel";
import SkillRadarChart from "@/components/dashboard/SkillRadarChart";
import CareerRoadmap from "@/components/dashboard/CareerRoadmap";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import ProgressTab from "@/components/dashboard/ProgressTab";

// Existing components that we'll reuse in a more modular way
import StatCard from "@/components/dashboard/StatCard";
import SmartSkillGraph from "@/components/dashboard/SmartSkillGraph";
import LearningPatternAnalysis from "@/components/dashboard/LearningPatternAnalysis";
import RecentActivity from "@/components/dashboard/RecentActivity";

import { useCareerGoal } from "@/contexts/CareerGoalContext";
import { queryClient } from "@/lib/queryClient";
import { LearningResource } from "@shared/schema";

// Dashboard data types 
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
    priority?: number;
    [key: string]: any;
  }>;
  learningPath?: {
    title: string;
    modules: any[];
  };
  recentActivities: any[];
  alternateRoles?: Array<{
    id: number;
    title: string;
    match?: number;
    description?: string;
    industry?: string;
  }>;
  inProgressResources?: Array<{
    id: number;
    title: string;
    progress?: number;
    completed?: boolean;
    dueDate?: string;
    type?: string;
  }>;
}

export default function Dashboard({ user }: { user: any }) {
  const [showAiFeatures, setShowAiFeatures] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use our centralized career goal context
  const { currentGoal, targetRoleSkills, isLoading: isLoadingGoal } = useCareerGoal();
  
  // Query for dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: [`/api/users/${user.id}/dashboard`],
    staleTime: 30000, // 30 seconds
  });
  
  // Refetch dashboard data when currentGoal changes
  useEffect(() => {
    console.log("[DEBUG] Dashboard - Current goal changed, refetching data:", 
      currentGoal ? { id: currentGoal.id, title: currentGoal.title, targetRoleId: currentGoal.targetRoleId } : null
    );
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/learning-resources'] });
  }, [refetch, currentGoal, currentGoal?.id, currentGoal?.targetRoleId]);

  // Query for learning resources 
  const { data: learningResources, isLoading: isLoadingResources } = useQuery<LearningResource[]>({
    queryKey: ['/api/learning-resources'],
  });

  // Parse skill validation count from stats
  const parseSkillValidation = () => {
    if (!dashboardData?.stats?.skillsValidated) return { completed: 0, total: 0 };
    const parts = dashboardData.stats.skillsValidated.split('/');
    return {
      completed: parseInt(parts[0].trim()) || 0,
      total: parseInt(parts[1].trim()) || 0
    };
  };
  
  // Parse resources count from stats
  const parseResourcesCount = () => {
    if (!dashboardData?.stats?.resourcesCompleted) return { completed: 0, total: 0 };
    const parts = dashboardData.stats.resourcesCompleted.split('/');
    return {
      completed: parseInt(parts[0].trim()) || 0,
      total: parseInt(parts[1].trim()) || 0
    };
  };
  
  // Loading state
  if (isLoading || isLoadingResources || isLoadingGoal) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Skill validation and resources counts
  const skillValidation = parseSkillValidation();
  const resourcesCount = parseResourcesCount();

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Greeting & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{dashboardData?.user?.greeting || `Hello, ${user.name.split(' ')[0]}!`}</h2>
          <p className="text-gray-600">Here's your skill development progress and recommended next steps.</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            variant={showAiFeatures ? "default" : "outline"} 
            size="sm" 
            className="gap-2"
            onClick={() => setShowAiFeatures(!showAiFeatures)}
          >
            {showAiFeatures ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showAiFeatures ? "Hide AI Features" : "Show AI Features"}
          </Button>
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
      
      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showAiFeatures && <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </TabsTrigger>}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="pt-6">
          {/* A. Career Status & Progress Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* A1. Progress Tracker */}
            <div>
              <ProgressTracker 
                progress={dashboardData?.stats?.overallProgress || 0}
                completedSkills={skillValidation.completed}
                totalSkills={skillValidation.total}
                targetRole={currentGoal ? {
                  title: currentGoal.title,
                  timeframe: `${currentGoal.timelineMonths} months`
                } : undefined}
              />
            </div>
            
            {/* A2. Skill Gap Summary */}
            <div>
              <SkillGapSummary 
                skills={dashboardData?.keySkills as any[]} 
                maxDisplayed={5}
              />
            </div>
            
            {/* A3. Next Steps or AI Recommendations */}
            <div>
              {showAiFeatures ? (
                <AIRecommendationsPanel isActive={false} />
              ) : (
                <NextStepsPanel 
                  showAIPlaceholder={true}
                />
              )}
            </div>
          </div>
          
          {/* B. Visualization & Career Path Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* B1. Skill Radar Chart */}
            <div>
              <SkillRadarChart width={300} height={300} />
            </div>
            
            {/* B2. Career Roadmap */}
            <div>
              <CareerRoadmap />
            </div>
          </div>
          
          {/* C. Learning & Resources Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* C1. Learning Progress Summary */}
            <div>
              <LearningProgressSummary 
                completedCount={resourcesCount.completed}
                totalCount={resourcesCount.total}
                resources={dashboardData?.inProgressResources || []}
              />
            </div>
            
            {/* C2. Notifications Panel */}
            <div>
              <NotificationPanel />
            </div>
          </div>
          
          {/* D. Career Path Recommendations & Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* D1. Career Path Recommendations */}
            <div>
              <CareerPathRecommendations 
                alternateRoles={dashboardData?.alternateRoles} 
                maxDisplayed={3}
              />
            </div>
            
            {/* D2. Recent Activity */}
            <div>
              <RecentActivity activities={dashboardData?.recentActivities || []} />
            </div>
          </div>
          
          {/* Debug info section */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-xs text-gray-400 mb-4">
              <div>Debug - Context Goal: {currentGoal?.title || 'not set'} (ID: {currentGoal?.id || 'none'})</div>
              <div>Debug - Context Target Role ID: {currentGoal?.targetRoleId || 'not set'}</div>
              <div>Debug - Context Skills: {targetRoleSkills?.join(', ') || 'none'}</div>
              <div>Debug - API Goal: {dashboardData?.careerGoal?.title || 'not set'} (ID: {dashboardData?.careerGoal?.id || 'none'})</div>
            </div>
          )}
        </TabsContent>
        
        {/* AI Insights Tab */}
        {showAiFeatures && (
          <TabsContent value="ai" className="pt-6">
            <div className="grid grid-cols-1 gap-8">
              {/* A. Full AI Recommendations Panel */}
              <div>
                <AIRecommendationsPanel isActive={true} />
              </div>
              
              {/* B. Smart Skill Graph */}
              <div>
                <SmartSkillGraph userId={user.id} />
              </div>
              
              {/* C. Learning Pattern Analysis */}
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
