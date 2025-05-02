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
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="transition-templates">
              <BriefcaseIcon className="h-4 w-4 mr-2" />
              Role Transitions
            </TabsTrigger>
            <TabsTrigger value="career-paths">
              <Compass className="h-4 w-4 mr-2" />
              Career Paths
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
                  <RoleComparisonCard 
                    currentRole={currentRole ?? null} 
                    targetRole={targetRole ?? null} 
                    onViewLearningPath={handleViewLearningPath}
                  />
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
          
          <TabsContent value="career-paths" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Career Path Explorer</CardTitle>
                <CardDescription>
                  Discover common career progression paths for various roles and industries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Role selection dropdown */}
                <div className="w-full md:max-w-lg">
                  <h3 className="text-base font-medium mb-2">Select a role to view its career progression path:</h3>
                  
                  {rolesLoading ? (
                    <div className="animate-pulse h-10 w-full bg-secondary rounded"></div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search and dropdown */}
                      {/* Search input */}
                      <div className="relative mb-2">
                        <label htmlFor="roleSearch" className="text-sm font-medium text-muted-foreground mb-1 block">
                          Search roles by title or industry:
                        </label>
                        <input
                          id="roleSearch"
                          type="text"
                          className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Type to search..."
                          value={roleSearchTerm}
                          onChange={(e) => setRoleSearchTerm(e.target.value)}
                        />
                      </div>

                      {/* Role selector */}
                      <div className="relative">
                        <label htmlFor="roleSelect" className="text-sm font-medium text-muted-foreground mb-1 block">
                          Select a role:
                        </label>
                        <select 
                          id="roleSelect"
                          className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          value={selectedRoleId || ''}
                          onChange={(e) => setSelectedRoleId(e.target.value ? parseInt(e.target.value) : null)}
                        >
                          <option value="">-- Select a role --</option>
                          {roles
                            ?.filter(role => 
                              roleSearchTerm === '' || 
                              role.title.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
                              (role.industry && role.industry.toLowerCase().includes(roleSearchTerm.toLowerCase()))
                            )
                            .map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.title} ({role.industry})
                              </option>
                            ))
                          }
                        </select>
                        {roleSearchTerm && roles?.filter(role => 
                          role.title.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
                          (role.industry && role.industry.toLowerCase().includes(roleSearchTerm.toLowerCase()))
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">No roles match your search.</p>
                        )}
                      </div>

                      {/* Selection guidance */}
                      {selectedRoleId ? (
                        <div className="py-2">
                          <p className="text-sm text-primary font-medium">
                            Role selected: {roles?.find(r => r.id === selectedRoleId)?.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            View the career progression path for this role below.
                          </p>
                        </div>
                      ) : (
                        <div className="py-2">
                          <p className="text-sm text-muted-foreground">
                            Select a role from the dropdown above to view its career progression path.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Career path visualization */}
                {selectedRoleId ? (
                  <div className="mt-4 border-t pt-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Compass className="h-5 w-5 mr-2 text-primary" />
                      Career Progression Timeline
                    </h3>
                    <div className="bg-background rounded-lg shadow-sm border p-4">
                      <CareerPathComponent roleId={selectedRoleId} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg mt-4">
                    <Compass className="h-16 w-16 text-primary mx-auto mb-3 opacity-60" />
                    <h3 className="text-lg font-medium mb-2">Career Path Explorer</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Select a role from the dropdown above to view its detailed career progression timeline, 
                      required skills, and recommended next steps.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
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