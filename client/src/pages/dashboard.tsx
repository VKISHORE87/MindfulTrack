import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import SkillGapAnalysis from "@/components/dashboard/SkillGapAnalysis";
import CareerGoals from "@/components/dashboard/CareerGoals";
import LearningPath from "@/components/dashboard/LearningPath";
import RecentActivity from "@/components/dashboard/RecentActivity";
import AiCoach from "@/components/dashboard/AiCoach";
import SmartSkillGraph from "@/components/dashboard/SmartSkillGraph";
import LearningPatternAnalysis from "@/components/dashboard/LearningPatternAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, PanelLeft, Eye, EyeOff } from "lucide-react";

export default function Dashboard({ user }: { user: any }) {
  const [showAiFeatures, setShowAiFeatures] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/users/${user.id}/dashboard`],
  });

  const { data: learningResources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['/api/learning-resources'],
  });

  if (isLoading || isLoadingResources) {
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
          {/* Primary content sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Skill Gap Analysis */}
            <div className="lg:col-span-2">
              <SkillGapAnalysis skillGaps={dashboardData?.skillGaps || []} />
            </div>
            
            {/* Career Goals */}
            <div>
              {dashboardData?.careerGoal ? (
                <CareerGoals 
                  id={dashboardData.careerGoal.id}
                  title={dashboardData.careerGoal.title}
                  timeline={dashboardData.careerGoal.timeline}
                  readiness={dashboardData.careerGoal.readiness}
                />
              ) : (
                <div className="bg-white rounded-xl shadow p-6 h-full flex flex-col items-center justify-center text-center">
                  <h3 className="text-lg font-bold mb-4">Set Your Career Goal</h3>
                  <p className="text-gray-600 mb-4">Define your target role to get personalized skill development recommendations</p>
                  <a href="/assessment" className="text-primary hover:text-primary-700 font-medium">Get Started →</a>
                </div>
              )}
            </div>
          </div>
          
          {/* Learning Path */}
          {dashboardData?.learningPath && (
            <div className="mb-8">
              <LearningPath 
                title={dashboardData.learningPath.title}
                modules={dashboardData.learningPath.modules}
                resources={learningResources || []}
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
