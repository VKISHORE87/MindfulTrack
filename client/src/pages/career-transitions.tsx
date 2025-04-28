import React from "react";
import { Helmet } from "react-helmet";
import CareerRoleComparison from "@/components/interview/CareerRoleComparison";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  BriefcaseIcon, 
  ChevronRight, 
  Compass, 
  GraduationCap, 
  BarChart4, 
  TrendingUp, 
  Layers 
} from "lucide-react";

export default function CareerTransitionsPage() {
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

        <Tabs defaultValue="role-comparison" className="space-y-4">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-4">
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
            <TabsTrigger value="market-trends">
              <TrendingUp className="h-4 w-4 mr-2" />
              Market Trends
            </TabsTrigger>
          </TabsList>
          
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
              <CardContent>
                <div className="text-center py-12">
                  <Layers className="h-12 w-12 text-primary mx-auto mb-4 opacity-60" />
                  <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We're building comprehensive career path visualizations to help you plan your long-term career progression. Stay tuned!
                  </p>
                </div>
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
          
          <TabsContent value="market-trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Industry & Market Trends</CardTitle>
                <CardDescription>
                  Stay informed about job market trends, growing industries, and in-demand skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart4 className="h-12 w-12 text-primary mx-auto mb-4 opacity-60" />
                  <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We're building a comprehensive market trends dashboard with real-time data on industry growth, salary trends, and emerging skill demands.
                  </p>
                </div>
              </CardContent>
            </Card>
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