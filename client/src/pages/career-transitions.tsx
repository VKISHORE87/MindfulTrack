import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import CareerPathComponent from "@/components/career/CareerPathComponent";
import CareerGoalForm from "@/components/career/CareerGoalForm";
import RoleTransitionTemplates from "@/components/career/RoleTransitionTemplates";
import RoleComparisonCard from "@/components/career/RoleComparisonCard";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight,
  BriefcaseIcon, 
  ChevronRight, 
  Compass, 
  GraduationCap, 
  TrendingUp, 
  Settings,
  Bookmark as BookmarkIcon,
  Target,
  Search
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InterviewRole } from "@shared/schema";

export default function CareerTransitionsPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('transition-templates');
  const [roleSearchTerm, setRoleSearchTerm] = useState<string>('');
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
  const [targetRoleId, setTargetRoleId] = useState<number | null>(null);
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Extract the tab from URL query parameters when the component mounts or location changes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab) {
      setSelectedTab(tab);
    }
  }, [location]);

  // Fetch user's career goal
  const { data: careerGoal, isLoading: goalLoading, error: goalError } = useQuery({
    queryKey: ['/api/users/career-goals/current'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/users/career-goals/current');
        if (res.status === 404) {
          // No career goal found, which is okay
          return null;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch career goal');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching career goal:', error);
        return null;
      }
    }
  });

  // Fetch available roles for the dropdown
  const { data: roles, isLoading: rolesLoading } = useQuery<InterviewRole[]>({
    queryKey: ['/api/interview/roles'],
    queryFn: async () => {
      const res = await fetch('/api/interview/roles');
      if (!res.ok) {
        throw new Error('Failed to fetch roles');
      }
      return res.json();
    }
  });
  
  // Fetch current role data
  const { data: currentRole, isLoading: currentRoleLoading } = useQuery<InterviewRole | null>({
    queryKey: ['/api/interview/roles', currentRoleId],
    queryFn: async () => {
      if (!currentRoleId) return null;
      const res = await fetch(`/api/interview/roles/${currentRoleId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch current role');
      }
      return res.json();
    },
    enabled: !!currentRoleId
  });
  
  // Fetch target role data
  const { data: targetRole, isLoading: targetRoleLoading } = useQuery<InterviewRole | null>({
    queryKey: ['/api/interview/roles', targetRoleId],
    queryFn: async () => {
      if (!targetRoleId) return null;
      const res = await fetch(`/api/interview/roles/${targetRoleId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch target role');
      }
      return res.json();
    },
    enabled: !!targetRoleId
  });
  
  // Handler for viewing the learning path
  const handleViewLearningPath = () => {
    if (targetRoleId) {
      // Navigate to learning roadmap tab
      setSelectedTab('learning-roadmap');
      toast({
        title: "Learning path view",
        description: "Navigated to the learning roadmap section"
      });
    } else {
      toast({
        title: "No target role selected",
        description: "Please select a target role to view its learning path",
        variant: "destructive"
      });
    }
  };
  
  // Handler for saving target role to user profile
  const handleSaveTargetRole = async () => {
    if (!targetRoleId) {
      toast({
        title: "No target role selected",
        description: "Please select a target role first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Make API call to save target role
      const response = await fetch('/api/users/career-goals/set-target-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetRoleId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save target role');
      }
      
      // Show success message
      toast({
        title: "Target role saved",
        description: `${targetRole?.title} has been set as your target role`,
      });
      
    } catch (error) {
      console.error('Error saving target role:', error);
      toast({
        title: "Error saving target role",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Career Transitions | Upcraft</title>
      </Helmet>
      
      <div className="container py-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Career Transitions</h1>
          <p className="text-muted-foreground">
            Plan your career journey, explore roles, and bridge the gap with personalized learning paths.
          </p>
        </header>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="transition-templates">
              <BriefcaseIcon className="h-4 w-4 mr-2" />
              Role Transitions
            </TabsTrigger>
            <TabsTrigger value="learning-roadmap">
              <GraduationCap className="h-4 w-4 mr-2" />
              Learning Roadmap
            </TabsTrigger>
            <TabsTrigger value="admin">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transition-templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Role Comparison & Required Skills</CardTitle>
                <CardDescription>
                  Compare roles side-by-side and see the skills needed for a successful transition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Role selection controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Role Selection */}
                  <div className="space-y-2">
                    <h3 className="text-base font-medium flex items-center">
                      <BriefcaseIcon className="h-4 w-4 mr-2 text-blue-600" />
                      Current Role
                    </h3>
                    <select 
                      className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={currentRoleId || ''}
                      onChange={(e) => setCurrentRoleId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">-- Select your current role --</option>
                      {roles?.map((role) => (
                        <option key={`current-${role.id}`} value={role.id}>
                          {role.title} ({role.industry})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Select the role that best matches your current position
                    </p>
                  </div>
                  
                  {/* Target Role Selection */}
                  <div className="space-y-2">
                    <h3 className="text-base font-medium flex items-center">
                      <Target className="h-4 w-4 mr-2 text-purple-600" />
                      Target Role
                    </h3>
                    <select 
                      className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={targetRoleId || ''}
                      onChange={(e) => setTargetRoleId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">-- Select your target role --</option>
                      {roles?.map((role) => (
                        <option key={`target-${role.id}`} value={role.id}>
                          {role.title} ({role.industry})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Select the role you want to transition into
                    </p>
                  </div>
                </div>
                
                {/* Role Comparison Card */}
                {(currentRoleLoading || targetRoleLoading) ? (
                  // Loading state
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-muted rounded-lg"></div>
                    <div className="h-64 bg-muted rounded-lg"></div>
                  </div>
                ) : currentRoleId && targetRoleId ? (
                  // Render comparison card when both roles are selected
                  <>
                    <RoleComparisonCard 
                      currentRole={currentRole ?? null} 
                      targetRole={targetRole ?? null} 
                      onViewLearningPath={handleViewLearningPath}
                    />
                    
                    {/* Save Target Role Button */}
                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={handleSaveTargetRole}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                      >
                        <BookmarkIcon className="h-4 w-4 mr-2" />
                        Save {targetRole?.title} as Target Role
                      </Button>
                    </div>
                    
                    {/* Career Path Progression Timeline */}
                    {targetRoleId && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="mb-4">
                          <h3 className="text-xl font-semibold mb-2 flex items-center">
                            <Compass className="h-5 w-5 mr-2 text-primary" />
                            Career Progression Timeline
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            View the recommended path to transition from {currentRole?.title} to {targetRole?.title}
                          </p>
                        </div>
                        <div className="bg-background rounded-lg shadow-sm border p-4">
                          <CareerPathComponent roleId={targetRoleId} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Empty state when roles aren't selected
                  <Card className="border-dashed border-gray-300 bg-gray-50">
                    <CardContent className="py-8 text-center text-gray-500">
                      <p>Select both current and target roles above to see a comparison</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
            
            <RoleTransitionTemplates />
          </TabsContent>
          
          {/* Career Paths tab content removed as requested */}
          
          <TabsContent value="learning-roadmap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Learning Roadmap</CardTitle>
                <CardDescription>
                  Get a tailored learning plan to bridge your skill gaps and prepare for your target role.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4 opacity-60" />
                  <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We're developing an AI-powered learning roadmap generator that creates personalized learning paths based on your skill assessment and career goals.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Market Trends tab removed to focus on skill-based transitions */}
          
          <TabsContent value="admin" className="space-y-4">
            <AdminPanel />
          </TabsContent>
        </Tabs>
        
        {/* Removed "Why Plan Your Career Transition?" section as requested */}
      </div>
    </>
  );
}