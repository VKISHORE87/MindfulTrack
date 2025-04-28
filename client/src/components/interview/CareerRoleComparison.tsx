import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, TrendingUp, DollarSign, BarChart4 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Type definitions for the roles
interface InterviewRole {
  id: number;
  title: string;
  description: string | null;
  requiredSkills: string[] | null;
  industry: string;
  level: string;
  roleType: string;
  averageSalary: string | null;
  growthRate: string | null;
  demandScore: number | null;
  createdAt: Date | null;
}

interface SkillGap {
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
}

export default function CareerRoleComparison() {
  const { toast } = useToast();
  const [currentRoleId, setCurrentRoleId] = useState<string>("");
  const [targetRoleId, setTargetRoleId] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);

  // Fetch all roles
  const { data: roles, isLoading } = useQuery<InterviewRole[]>({
    queryKey: ["/api/interview/roles"],
    placeholderData: [],
  });

  // Fetch specific roles when comparing
  const { data: currentRole, isLoading: isLoadingCurrentRole } = useQuery<InterviewRole>({
    queryKey: ["/api/interview/roles", currentRoleId],
    enabled: isComparing && !!currentRoleId,
  });

  const { data: targetRole, isLoading: isLoadingTargetRole } = useQuery<InterviewRole>({
    queryKey: ["/api/interview/roles", targetRoleId],
    enabled: isComparing && !!targetRoleId,
  });

  // Create a list of unique industries from roles
  const industries = roles 
    ? [...new Set(roles.map((role: InterviewRole) => role.industry))]
    : [];

  // Filter roles by industry if set
  const filteredRoles = roles 
    ? (industryFilter && industryFilter !== "all_industries")
      ? roles.filter((role: InterviewRole) => role.industry === industryFilter) 
      : roles
    : [];

  // Start comparison
  const handleCompare = () => {
    if (!currentRoleId || !targetRoleId) {
      toast({
        title: "Please select roles",
        description: "You need to select both a current and target role to compare.",
        variant: "destructive"
      });
      return;
    }

    setIsComparing(true);
    // This would ideally fetch skill gap analysis from the backend
    // For now, we'll generate mock skill gaps for demonstration
    calculateSkillGaps();
  };

  // Reset comparison
  const handleReset = () => {
    setIsComparing(false);
    setCurrentRoleId("");
    setTargetRoleId("");
    setSkillGaps([]);
  };

  // Calculate skill gaps (in a real app, this would be done on the backend)
  const calculateSkillGaps = () => {
    if (!currentRole || !targetRole) return;

    // This is a placeholder. In a real application, 
    // you would get actual user skills and compare them with required skills
    const mockSkills = [
      { skillName: "JavaScript", currentLevel: 80, requiredLevel: 90, gap: 10 },
      { skillName: "React", currentLevel: 70, requiredLevel: 85, gap: 15 },
      { skillName: "Node.js", currentLevel: 60, requiredLevel: 80, gap: 20 },
      { skillName: "Product Management", currentLevel: 50, requiredLevel: 90, gap: 40 },
      { skillName: "Stakeholder Communication", currentLevel: 75, requiredLevel: 85, gap: 10 },
    ];
    
    setSkillGaps(mockSkills);
  };

  const getRoleTypeColor = (roleType: string) => {
    const colors: {[key: string]: string} = {
      technical: "bg-blue-100 text-blue-800",
      creative: "bg-purple-100 text-purple-800",
      business: "bg-green-100 text-green-800",
      leadership: "bg-amber-100 text-amber-800",
      operations: "bg-slate-100 text-slate-800",
      customer_facing: "bg-pink-100 text-pink-800",
      healthcare: "bg-red-100 text-red-800",
      education: "bg-cyan-100 text-cyan-800",
      administrative: "bg-gray-100 text-gray-800",
      finance: "bg-emerald-100 text-emerald-800",
      legal: "bg-indigo-100 text-indigo-800",
      marketing: "bg-rose-100 text-rose-800",
      research: "bg-teal-100 text-teal-800",
      human_resources: "bg-orange-100 text-orange-800"
    };
    
    return colors[roleType] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Career Role Comparison
          </CardTitle>
          <CardDescription>
            Compare different roles to plan your career transition and understand the required skills gap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isComparing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="industry-select">Industry Filter (Optional)</Label>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger id="industry-select">
                      <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_industries">All Industries</SelectItem>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry.charAt(0).toUpperCase() + industry.slice(1).replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="current-role-select">Your Current Role</Label>
                  <Select value={currentRoleId} onValueChange={setCurrentRoleId}>
                    <SelectTrigger id="current-role-select">
                      <SelectValue placeholder="Select your current role" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRoles.map((role: InterviewRole) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="target-role-select">Target Role</Label>
                  <Select value={targetRoleId} onValueChange={setTargetRoleId}>
                    <SelectTrigger id="target-role-select">
                      <SelectValue placeholder="Select your target role" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRoles.map((role: InterviewRole) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleCompare} size="lg">
                  Compare Roles <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {(isLoadingCurrentRole || isLoadingTargetRole) ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Current Role Card */}
                    <Card className="border-2 border-blue-200">
                      <CardHeader className="bg-blue-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{currentRole?.title}</CardTitle>
                            <CardDescription>{currentRole?.industry.charAt(0).toUpperCase() + currentRole?.industry.slice(1).replace(/_/g, ' ')}</CardDescription>
                          </div>
                          <Badge className={getRoleTypeColor(currentRole?.roleType || "")}>
                            {currentRole?.roleType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-4">{currentRole?.description}</p>
                        
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium">Average Salary</div>
                              <div className="text-lg font-bold">${currentRole?.averageSalary || "N/A"}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium">Growth Rate</div>
                              <div className="text-lg font-bold">{currentRole?.growthRate || "0"}%</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <BarChart4 className="h-5 w-5 text-purple-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium">Demand Score</div>
                              <div className="text-lg font-bold">{currentRole?.demandScore || "N/A"}/10</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {currentRole?.requiredSkills?.map((skill, index) => (
                              <Badge key={index} variant="outline">{skill}</Badge>
                            ))}
                            {!currentRole?.requiredSkills?.length && (
                              <span className="text-sm text-gray-500">No skills listed</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Target Role Card */}
                    <Card className="border-2 border-purple-200">
                      <CardHeader className="bg-purple-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{targetRole?.title}</CardTitle>
                            <CardDescription>{targetRole?.industry.charAt(0).toUpperCase() + targetRole?.industry.slice(1).replace(/_/g, ' ')}</CardDescription>
                          </div>
                          <Badge className={getRoleTypeColor(targetRole?.roleType || "")}>
                            {targetRole?.roleType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-4">{targetRole?.description}</p>
                        
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium">Average Salary</div>
                              <div className="text-lg font-bold">${targetRole?.averageSalary || "N/A"}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium">Growth Rate</div>
                              <div className="text-lg font-bold">{targetRole?.growthRate || "0"}%</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <BarChart4 className="h-5 w-5 text-purple-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium">Demand Score</div>
                              <div className="text-lg font-bold">{targetRole?.demandScore || "N/A"}/10</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {targetRole?.requiredSkills?.map((skill, index) => (
                              <Badge key={index} variant="outline">{skill}</Badge>
                            ))}
                            {!targetRole?.requiredSkills?.length && (
                              <span className="text-sm text-gray-500">No skills listed</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Skills Gap Analysis */}
                  <Separator />
                  
                  <div>
                    <h3 className="text-xl font-bold mb-4">Skills Gap Analysis</h3>
                    <div className="space-y-6">
                      {skillGaps.map((skill, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{skill.skillName}</span>
                            <span className="text-sm text-gray-500">
                              Current: {skill.currentLevel}% | Required: {skill.requiredLevel}%
                            </span>
                          </div>
                          <Progress value={skill.currentLevel} max={skill.requiredLevel} className="h-2" />
                          <div className="text-sm text-right">
                            {skill.gap > 0 ? (
                              <span className="text-orange-500">Gap: {skill.gap}%</span>
                            ) : (
                              <span className="text-green-500">Proficient</span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {skillGaps.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No skill gap analysis available
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleReset} variant="outline" className="mr-2">
                      Reset
                    </Button>
                    <Button>
                      View Detailed Learning Path
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}