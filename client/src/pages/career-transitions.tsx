import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import CareerRoleComparison from "@/components/interview/CareerRoleComparison";
import CareerPathComponent from "@/components/career/CareerPathComponent";
import CareerGoalForm from "@/components/career/CareerGoalForm";
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
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight,
  BriefcaseIcon, 
  ChevronRight, 
  Compass, 
  GraduationCap, 
  TrendingUp, 
  Settings,
  Target
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InterviewRole } from "@shared/schema";

export default function CareerTransitionsPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('career-goals');
  const [roleSearchTerm, setRoleSearchTerm] = useState<string>('');
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
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="career-goals">
              <Target className="h-4 w-4 mr-2" />
              Career Goals
            </TabsTrigger>
            <TabsTrigger value="role-comparison">
              <BriefcaseIcon className="h-4 w-4 mr-2" />
              Role Comparison
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
          
          <TabsContent value="career-goals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Career Goals</CardTitle>
                <CardDescription>
                  Set and manage your career goals and track your progress over time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {goalLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse h-10 w-full bg-secondary rounded"></div>
                    <div className="animate-pulse h-24 w-full bg-secondary rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="animate-pulse h-10 w-full bg-secondary rounded"></div>
                      <div className="animate-pulse h-10 w-full bg-secondary rounded"></div>
                    </div>
                  </div>
                ) : goalError ? (
                  <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md">
                    <p className="text-destructive">Error loading career goal: {(goalError as Error).message}</p>
                  </div>
                ) : (
                  <CareerGoalForm 
                    existingGoal={careerGoal || {
                      id: 1,
                      title: "Senior Software Engineer",
                      timeline: "1 year",
                      readiness: 65,
                      targetRoleId: "15",
                      description: "My goal is to master system design and lead a development team."
                    }}
                    onSuccess={() => {
                      toast({
                        title: "Success",
                        description: "Your career goal has been saved successfully",
                      });
                      // Navigation is now handled in the CareerGoalForm component
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="role-comparison" className="space-y-4">
            <CareerRoleComparison />
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

                      {/* Featured/Filtered roles */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                          {roleSearchTerm ? "Matching Roles:" : "Featured Roles:"}
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2">
                          {roles
                            ?.filter(role => 
                              roleSearchTerm === '' || 
                              role.title.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
                              (role.industry && role.industry.toLowerCase().includes(roleSearchTerm.toLowerCase()))
                            )
                            .slice(0, 6)
                            .map((role) => (
                              <Button
                                key={role.id}
                                variant={selectedRoleId === role.id ? "default" : "outline"}
                                className="justify-start h-auto py-3 text-left"
                                onClick={() => setSelectedRoleId(role.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${selectedRoleId === role.id ? 'bg-primary-foreground' : 'bg-primary/30'}`}></div>
                                  <div>
                                    <div className="font-medium">{role.title}</div>
                                    <div className="text-xs text-muted-foreground">{role.industry}</div>
                                  </div>
                                </div>
                                {selectedRoleId === role.id && (
                                  <ArrowRight className="h-4 w-4 ml-auto" />
                                )}
                              </Button>
                            ))}
                            
                            {roleSearchTerm && roles?.filter(role => 
                              role.title.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
                              (role.industry && role.industry.toLowerCase().includes(roleSearchTerm.toLowerCase()))
                            ).length === 0 && (
                              <div className="col-span-2 text-center py-4">
                                <p className="text-muted-foreground">No roles match your search criteria.</p>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Career path visualization */}
                {selectedRoleId ? (
                  <div className="mt-8">
                    <CareerPathComponent roleId={selectedRoleId} />
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/30 rounded-lg">
                    <Compass className="h-12 w-12 text-primary mx-auto mb-2 opacity-60" />
                    <p className="text-muted-foreground">
                      Select a role above to view its career progression path
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
        
        <Separator />
        
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Why Plan Your Career Transition?</h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  Higher Earning Potential
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Strategic career transitions can lead to significant salary increases and better benefits packages.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  Skill Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Transitions push you to develop new skills and competencies, making you more versatile and valuable.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-2">
                    <Compass className="h-5 w-5 text-primary" />
                  </div>
                  Career Fulfillment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Finding work that aligns with your values and strengths leads to greater job satisfaction and fulfillment.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}