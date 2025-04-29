import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Calendar, 
  CheckCircle, 
  Briefcase, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  ChevronRight, 
  Clock, 
  ArrowRight,
  LayoutDashboard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define types for API responses
interface DashboardData {
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
  };
  careerGoal?: {
    id: number;
    title: string;
    description?: string;
    targetRoleId?: number | string;
    userId: number;
    timelineMonths?: number;
    createdAt?: string;
  };
  skills?: any[];
  skillGaps?: any[];
  activities?: any[];
  progress?: any;
  recommendations?: any[];
}

interface RoleSkill {
  id: number;
  name: string;
  category: string;
  description?: string;
  industryStandardLevel: number;
}

interface LearningPathModule {
  title: string;
  description: string;
  timeframe: string;
  activities?: string[];
  resources?: Array<{
    title: string;
    url?: string;
    type?: string;
  }>;
}

interface LearningPath {
  id: number;
  userId: number;
  targetRoleId?: number | string;
  title: string;
  description: string;
  modules?: LearningPathModule[];
  createdAt?: string;
}

interface CareerPlanProps {
  userId?: number;
  targetRoleId?: number | string;
}

export default function CareerPlan({ userId = 1, targetRoleId }: CareerPlanProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get the user's dashboard data which includes career goal
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: [`/api/users/${userId}/dashboard`],
  });

  // Get role-specific skills if a target role ID is available
  const { data: roleSkills, isLoading: isRoleSkillsLoading } = useQuery<RoleSkill[]>({
    queryKey: [targetRoleId ? `/api/skills/role/${targetRoleId}` : null],
    enabled: !!targetRoleId,
  });

  // Get existing learning paths
  const { data: learningPaths, isLoading: isLearningPathsLoading } = useQuery<LearningPath[]>({
    queryKey: [`/api/users/${userId}/learning-paths`],
  });

  // If no specific targetRoleId is provided, use the one from the career goal
  const effectiveTargetRoleId = targetRoleId || dashboardData?.careerGoal?.targetRoleId;
  const roleName = dashboardData?.careerGoal?.title || "your target role";

  // Generate a new career plan
  const generateCareerPlan = async () => {
    if (!dashboardData?.careerGoal?.id) {
      toast({
        title: "No career goal found",
        description: "Please set a career goal first to generate a career plan.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/ai/career-plan", {
        userId,
        careerGoalId: dashboardData.careerGoal.id,
        targetRole: effectiveTargetRoleId,
        timeline: dashboardData.careerGoal.timelineMonths || 12
      });

      // Refresh queries to get the latest data
      await queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/learning-paths`],
      });

      toast({
        title: "Career plan generated",
        description: "Your personalized career plan has been created.",
      });

      // Switch to the plan tab
      setActiveTab("plan");
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was a problem generating your career plan.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = isDashboardLoading || isRoleSkillsLoading || isLearningPathsLoading;
  const hasPlan = Array.isArray(learningPaths) && learningPaths.length > 0;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Career Plan for {roleName}</h1>
          <p className="text-gray-600">
            Create and follow a personalized roadmap to achieve your career goals
          </p>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            onClick={generateCareerPlan} 
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>Generating</>
            ) : (
              <>
                {hasPlan ? "Regenerate Plan" : "Generate Plan"}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full grid grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plan">Career Plan</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operations Manager Career Path</CardTitle>
              <CardDescription>
                Industry insights and career progression for Operations Managers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center mb-2">
                    <Briefcase className="h-4 w-4 mr-2 text-primary" />
                    Common Career Path
                  </h3>
                  <div className="text-sm space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <div>
                        <p className="font-medium">Operations Coordinator/Analyst</p>
                        <p className="text-gray-500">Entry-level position</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <div>
                        <p className="font-medium">Assistant Operations Manager</p>
                        <p className="text-gray-500">2-3 years experience</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <div>
                        <p className="font-medium">Operations Manager</p>
                        <p className="text-gray-500">3-5 years experience</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <div>
                        <p className="font-medium">Senior Operations Manager</p>
                        <p className="text-gray-500">5-8 years experience</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <div>
                        <p className="font-medium">Director of Operations</p>
                        <p className="text-gray-500">8+ years experience</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center mb-2">
                    <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                    Recommended Certifications
                  </h3>
                  <div className="text-sm space-y-3">
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <p>Certified Supply Chain Professional (CSCP)</p>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <p>Project Management Professional (PMP)</p>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <p>Six Sigma Green/Black Belt</p>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <p>Certified Manager (CM)</p>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <p>Lean Management Certification</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center mb-2">
                    <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                    Industry Trends
                  </h3>
                  <div className="text-sm space-y-3">
                    <div className="flex items-start">
                      <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                      <p>Digital transformation of operations workflows</p>
                    </div>
                    <div className="flex items-start">
                      <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                      <p>Data-driven decision making and analytics</p>
                    </div>
                    <div className="flex items-start">
                      <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                      <p>Remote/hybrid operations management</p>
                    </div>
                    <div className="flex items-start">
                      <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                      <p>Supply chain resilience strategies</p>
                    </div>
                    <div className="flex items-start">
                      <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5" />
                      <p>Sustainability and ethical operations</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-4">Core Skills for Success</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {roleSkills && Array.isArray(roleSkills) && roleSkills.slice(0, 10).map((skill, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{skill.name}</span>
                        <span>{skill.industryStandardLevel}%</span>
                      </div>
                      <Progress value={skill.industryStandardLevel} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center">
                      <Award className="h-4 w-4 mr-2 text-primary" />
                      Career Outlook
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="mb-2">Operations Manager roles are projected to grow 6-8% over the next decade, with increasing demand in technology, healthcare, and logistics sectors.</p>
                    <p>Strong demand for those with digital operations expertise and change management skills.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      Typical Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="mb-2">
                      <span className="font-medium">Entry to Operations Manager:</span> 3-5 years
                    </p>
                    <p className="mb-2">
                      <span className="font-medium">Operations Manager to Senior:</span> 2-3 years
                    </p>
                    <p>
                      <span className="font-medium">Senior to Director:</span> 3-5 years
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      Time Investment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="mb-2">
                      <span className="font-medium">Technical skills:</span> 120-150 hours
                    </p>
                    <p className="mb-2">
                      <span className="font-medium">Leadership development:</span> 80-100 hours
                    </p>
                    <p>
                      <span className="font-medium">Certifications:</span> 40-60 hours each
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {!hasPlan && (
                <div className="flex justify-center mt-8">
                  <Button 
                    size="lg" 
                    onClick={generateCareerPlan} 
                    disabled={isGenerating}
                    className="w-full md:w-auto"
                  >
                    {isGenerating ? "Generating Plan..." : "Generate Your Personalized Career Plan"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          {hasPlan ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Personalized Career Plan</CardTitle>
                <CardDescription>
                  Follow this step-by-step roadmap to reach your Operations Manager goal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {learningPaths && learningPaths[0]?.modules?.map((module: any, index: number) => (
                    <div key={index} className="relative pl-8 pb-8 border-l-2 border-primary/20 last:border-0 last:pb-0">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full mb-2">
                          Phase {index + 1}
                        </span>
                        <h3 className="text-lg font-bold">{module.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{module.timeframe}</p>
                      </div>
                      <p className="mb-4">{module.description}</p>
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Key Actions:</h4>
                        <ul className="space-y-2">
                          {module.activities?.map((activity: string, actIdx: number) => (
                            <li key={actIdx} className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-primary mr-2 mt-1" />
                              <span className="text-sm">{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {module.resources && module.resources.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <h4 className="font-medium text-sm mb-2">Recommended Resources:</h4>
                          <ul className="space-y-1.5">
                            {module.resources?.map((resource: any, resIdx: number) => (
                              <li key={resIdx} className="text-sm flex items-center">
                                <ChevronRight className="h-3 w-3 text-primary mr-1" />
                                <a 
                                  href={resource.url || "#"} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {resource.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-muted/50 rounded-lg p-12 text-center">
              <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Career Plan Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Generate a personalized career plan based on your skills and career goals
              </p>
              <Button 
                onClick={generateCareerPlan} 
                disabled={isGenerating}
              >
                {isGenerating ? "Generating Plan..." : "Generate Career Plan"}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Resources for Operations Managers</CardTitle>
              <CardDescription>
                Curated books, courses, and tools to help you develop critical skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="courses">
                <TabsList className="mb-4">
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="books">Books</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                  <TabsTrigger value="communities">Communities</TabsTrigger>
                </TabsList>
                
                <TabsContent value="courses" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Operations Management MasterClass</CardTitle>
                        <CardDescription>Coursera</CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="mb-3">Comprehensive course covering process improvement, quality management, and operational strategy.</p>
                        <Button variant="outline" size="sm" className="w-full">View Course</Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Lean Six Sigma Green Belt</CardTitle>
                        <CardDescription>edX</CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="mb-3">Learn to apply Lean Six Sigma methods to improve processes, reduce waste, and deliver value.</p>
                        <Button variant="outline" size="sm" className="w-full">View Course</Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Supply Chain Management Specialization</CardTitle>
                        <CardDescription>Rutgers University (Coursera)</CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="mb-3">Learn the essentials of managing global supply chains, logistics, and operations.</p>
                        <Button variant="outline" size="sm" className="w-full">View Course</Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Leadership for Operations Managers</CardTitle>
                        <CardDescription>LinkedIn Learning</CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="mb-3">Develop the leadership skills needed to manage teams, drive change, and improve operations.</p>
                        <Button variant="outline" size="sm" className="w-full">View Course</Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="books" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">"Operations Management" by Nigel Slack</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>The definitive guide to operations management principles and practice.</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">"The Goal" by Eliyahu Goldratt</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>A business novel about operations that introduces the Theory of Constraints.</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">"Lean Thinking" by James Womack</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>How to banish waste and create wealth in your organization using lean principles.</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">"The Toyota Way" by Jeffrey Liker</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>14 management principles from the world's greatest manufacturer.</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">"Supply Chain Management" by Sunil Chopra</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>Strategy, planning and operation of the complete supply chain.</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">"The Effective Executive" by Peter Drucker</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>The definitive guide to getting the right things done in management.</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="tools" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Process Mapping Software</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Lucidchart</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Microsoft Visio</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>draw.io</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Project Management Tools</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Asana</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Monday.com</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Trello</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Data Analysis Tools</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Tableau</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Power BI</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Excel Advanced Analytics</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Operational Excellence Tools</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Minitab (Six Sigma)</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Kanban Tools</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Lean Waste Analysis Tools</span>
                          <Button variant="link" size="sm" className="h-auto p-0">Explore</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="communities" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Professional Associations</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 text-primary mr-2" />
                          <span>Association for Supply Chain Management (ASCM)</span>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 text-primary mr-2" />
                          <span>Institute for Operations Research and Management Sciences</span>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 text-primary mr-2" />
                          <span>American Production and Inventory Control Society</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Online Forums</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 text-primary mr-2" />
                          <span>r/OperationsManagement</span>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 text-primary mr-2" />
                          <span>LinkedIn Operations Management Groups</span>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 text-primary mr-2" />
                          <span>OperationsManagers.org Community</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Networking Opportunities</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 text-primary mr-2" />
                          <span>Operations Excellence Summits</span>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 text-primary mr-2" />
                          <span>Supply Chain & Logistics Expos</span>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 text-primary mr-2" />
                          <span>Industry-specific Operations Conferences</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}