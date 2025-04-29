import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import SkillAssessmentForm from "@/components/assessment/SkillAssessmentForm";
import SkillProgressBar from "@/components/ui/SkillProgressBar";
import CareerPlan from "@/components/career/CareerPlan";
import { useLocation } from "wouter";
import { 
  BrainCircuit, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Loader2 
} from "lucide-react";

interface User {
  id: number;
  name: string;
  [key: string]: any;
}

interface Skill {
  id: number;
  name: string;
  category: string;
  description: string;
}

interface UserSkill {
  skillId: number;
  currentLevel: number;
  targetLevel: number;
}

interface CareerGoal {
  id: number;
  title: string;
  timeline: string;
  targetRoleId?: string;
  timelineMonths?: number;
  readiness: number;
}

interface DashboardData {
  user?: User;
  careerGoal?: CareerGoal;
  keySkills?: any[];
  skillGaps?: any[];
  learningPath?: any;
  recentActivities?: any[];
  stats?: any;
}

export default function Assessment({ user }: { user: User }) {
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("assessment");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Handle URL query parameters for tab selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'analysis') {
      setActiveTab('analysis');
    }
  }, [location]);

  // Fetch user career goals
  const { 
    data: careerGoals = [], 
    isLoading: isLoadingCareerGoals 
  } = useQuery<CareerGoal[]>({
    queryKey: [`/api/users/${user.id}/career-goals`],
  });
  
  // Determine if we have a targetRoleId to fetch skills for
  const targetRoleId = careerGoals[0]?.targetRoleId;
  
  // Fetch role-specific skills if a role is set, otherwise fetch all skills
  const { 
    data: skills = [], 
    isLoading: isLoadingSkills 
  } = useQuery<Skill[]>({
    queryKey: [
      targetRoleId 
        ? `/api/skills/role/${targetRoleId}` 
        : '/api/skills'
    ],
    enabled: !isLoadingCareerGoals, // Only run after career goals are loaded
  });

  // Fetch user skills
  const { 
    data: userSkills = null, 
    isLoading: isLoadingUserSkills 
  } = useQuery<UserSkill[] | null>({
    queryKey: [`/api/users/${user.id}/skills`],
  });

  // Fetch dashboard data for skill gaps analysis
  const { 
    data: dashboardData = {}, 
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard 
  } = useQuery<DashboardData>({
    queryKey: [`/api/users/${user.id}/dashboard`],
    // Disable stale time to ensure fresh data
    staleTime: 0,
  });

  // Refresh dashboard data when switching to analysis tab
  useEffect(() => {
    if (activeTab === 'analysis') {
      // Fetch the latest dashboard data when viewing the skill gap analysis
      refetchDashboard();
    }
  }, [activeTab, refetchDashboard]);
  
  const isLoading = isLoadingSkills || isLoadingUserSkills || isLoadingCareerGoals || isLoadingDashboard;

  const generateSkillGapAnalysis = async () => {
    if (careerGoals.length === 0) {
      toast({
        title: "No career goal set",
        description: "Please set a career goal first to generate a skill gap analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await apiRequest("POST", "/api/ai/skill-gap-analysis", {
        userId: user.id,
        careerGoalId: careerGoals[0].id,
      });
      
      // Invalidate dashboard data to refresh skill gap analysis
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/dashboard`] });
      
      toast({
        title: "Skill gap analysis generated",
        description: "Your personalized skill gap analysis has been updated.",
      });
      
      setActiveTab("analysis");
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was a problem generating your skill gap analysis.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Skill Assessment</h2>
        <p className="text-gray-600">Assess your skills and identify gaps to achieve your career goals.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assessment">Self Assessment</TabsTrigger>
          <TabsTrigger value="analysis">Gap Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assessment" className="mt-6">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Skill Self-Assessment</h3>
                  <p className="text-sm text-gray-500">Rate your current skill levels and set target goals</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {targetRoleId ? (
                <p className="mb-6">
                  These skills are required for your target role. Rate your current proficiency level and set 
                  a target level you aim to achieve. This will help identify skill gaps for your career goal.
                </p>
              ) : (
                <p className="mb-6">
                  For each skill, rate your current proficiency level and set a target level you aim to achieve. 
                  This will help us identify your skill gaps and create a personalized learning path.
                </p>
              )}
              
              <SkillAssessmentForm 
                skills={skills} 
                userSkills={userSkills} 
                userId={user.id} 
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={generateSkillGapAnalysis} 
              disabled={isGenerating || careerGoals.length === 0}
              className="bg-primary hover:bg-primary-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Analysis
                </>
              ) : (
                <>
                  Generate Skill Gap Analysis
                </>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Skill Gap Analysis</h3>
                    <p className="text-sm text-gray-500">Current skill levels compared to target role requirements</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dashboardData.skillGaps && dashboardData.skillGaps.length > 0 ? (
                  dashboardData.skillGaps.map((skill) => (
                    <SkillProgressBar
                      key={skill.id}
                      skillName={skill.name}
                      percentage={skill.percentage}
                      className="mb-6"
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                    <p>No skill gap analysis available. Please complete your skill assessment first.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Career Goal</h3>
                </div>
              </CardHeader>
              <CardContent>
                {dashboardData.careerGoal ? (
                  <div>
                    <h4 className="font-medium text-lg mb-2">{dashboardData.careerGoal.title}</h4>
                    <p className="text-sm text-gray-500 mb-4">{dashboardData.careerGoal.timeline}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Overall readiness</span>
                          <span className="text-sm font-medium">{dashboardData.careerGoal.readiness}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full animate-progress" 
                            style={{ width: `${dashboardData.careerGoal.readiness}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium mb-2">Recommendations</h5>
                        <ul className="space-y-2">
                          {dashboardData.careerGoal.readiness < 50 && (
                            <li className="flex items-start">
                              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                              <p className="text-sm">Focus on improving key missing skills</p>
                            </li>
                          )}
                          {dashboardData.careerGoal.readiness >= 70 && (
                            <li className="flex items-start">
                              <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                              <p className="text-sm">You're making great progress!</p>
                            </li>
                          )}
                          <li className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                            <p className="text-sm">Complete recommended learning resources</p>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No career goal set</p>
                    <Button variant="outline" className="w-full">Set Career Goal</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Career Plan section */}
          {dashboardData.careerGoal && dashboardData.keySkills && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Create Your Career Plan</h3>
              <CareerPlan 
                userId={user.id}
                careerGoalId={dashboardData.careerGoal.id}
                targetRole={dashboardData.careerGoal.title}
                skills={dashboardData.keySkills}
                timeline={parseInt(dashboardData.careerGoal.timeline.match(/\d+/)?.[0] || "6")}
              />
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setActiveTab("assessment")}
              variant="outline"
              className="mr-2"
            >
              Update Assessment
            </Button>
            <Button 
              className="bg-primary hover:bg-primary-700"
              onClick={() => {
                if (careerGoals.length === 0) {
                  toast({
                    title: "No career goal set",
                    description: "Please set a career goal first to generate a learning path.",
                    variant: "destructive",
                  });
                  return;
                }
                
                apiRequest("POST", "/api/ai/generate-learning-path", {
                  userId: user.id,
                  careerGoalId: careerGoals[0].id
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/learning-paths`] });
                  toast({
                    title: "Learning path generated",
                    description: "Your personalized learning path has been created",
                  });
                }).catch(() => {
                  toast({
                    title: "Error generating learning path",
                    description: "There was an error generating your learning path",
                    variant: "destructive",
                  });
                });
              }}
            >
              Generate Learning Path
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
