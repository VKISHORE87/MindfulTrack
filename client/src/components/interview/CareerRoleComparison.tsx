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
import { Loader2, ArrowRight, TrendingUp, DollarSign, BarChart4, CheckCircle } from "lucide-react";
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
  const [currentRoleSearch, setCurrentRoleSearch] = useState<string>("");
  const [targetRoleSearch, setTargetRoleSearch] = useState<string>("");
  const [showCurrentSuggestions, setShowCurrentSuggestions] = useState<boolean>(false);
  const [showTargetSuggestions, setShowTargetSuggestions] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  
  // References for click outside detection
  const currentSearchRef = React.useRef<HTMLDivElement>(null);
  const targetSearchRef = React.useRef<HTMLDivElement>(null);
  
  // Close suggestions when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currentSearchRef.current && !currentSearchRef.current.contains(event.target as Node)) {
        setShowCurrentSuggestions(false);
      }
      if (targetSearchRef.current && !targetSearchRef.current.contains(event.target as Node)) {
        setShowTargetSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    ? Array.from(new Set(roles.map((role: InterviewRole) => role.industry)))
    : [];

  // Filter roles by industry and search terms
  const filteredCurrentRoles = roles 
    ? roles.filter((role: InterviewRole) => {
        // Apply industry filter if set
        const industryMatch = !industryFilter || industryFilter === "all_industries" || role.industry === industryFilter;
        
        // Apply search filter if provided
        const searchMatch = !currentRoleSearch || 
          role.title.toLowerCase().includes(currentRoleSearch.toLowerCase()) || 
          (role.description && role.description.toLowerCase().includes(currentRoleSearch.toLowerCase())) ||
          role.industry.toLowerCase().includes(currentRoleSearch.toLowerCase()) ||
          (role.roleType && role.roleType.toLowerCase().includes(currentRoleSearch.toLowerCase()));
        
        return industryMatch && searchMatch;
      })
    : [];
    
  const filteredTargetRoles = roles 
    ? roles.filter((role: InterviewRole) => {
        // Apply industry filter if set
        const industryMatch = !industryFilter || industryFilter === "all_industries" || role.industry === industryFilter;
        
        // Apply search filter if provided
        const searchMatch = !targetRoleSearch || 
          role.title.toLowerCase().includes(targetRoleSearch.toLowerCase()) || 
          (role.description && role.description.toLowerCase().includes(targetRoleSearch.toLowerCase())) ||
          role.industry.toLowerCase().includes(targetRoleSearch.toLowerCase()) ||
          (role.roleType && role.roleType.toLowerCase().includes(targetRoleSearch.toLowerCase()));
        
        return industryMatch && searchMatch;
      })
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

  // Calculate skill gaps by comparing current role skills with target role skills
  const calculateSkillGaps = () => {
    if (!currentRole || !targetRole) return;

    // Get skills from both roles
    const currentSkills = currentRole.requiredSkills || [];
    const targetSkills = targetRole.requiredSkills || [];
    
    // Create a mapping of current skills with an assumed proficiency level
    const currentSkillsMap = new Map();
    currentSkills.forEach(skill => {
      currentSkillsMap.set(skill.toLowerCase(), 80); // Assume 80% proficiency in current role skills
    });
    
    const calculatedGaps: SkillGap[] = [];
    
    // For each target skill, check if it exists in current skills
    targetSkills.forEach(skill => {
      const skillName = skill;
      const requiredLevel = 90; // Assume 90% proficiency needed for target role
      
      // If the skill exists in current skills, gap is smaller
      const currentLevel = currentSkillsMap.has(skill.toLowerCase()) 
        ? currentSkillsMap.get(skill.toLowerCase()) 
        : 30; // If skill doesn't exist in current role, assume 30% baseline
      
      const gap = requiredLevel - currentLevel;
      
      if (gap > 0) {
        calculatedGaps.push({
          skillName,
          currentLevel,
          requiredLevel,
          gap
        });
      }
    });
    
    // Sort gaps by largest gap first
    calculatedGaps.sort((a, b) => b.gap - a.gap);
    
    setSkillGaps(calculatedGaps);
  };

  // Handle current role search
  const handleCurrentRoleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentRoleSearch(e.target.value);
    setShowCurrentSuggestions(e.target.value.length > 0);
  };

  // Handle target role search
  const handleTargetRoleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetRoleSearch(e.target.value);
    setShowTargetSuggestions(e.target.value.length > 0);
  };

  // Handle selecting a current role from suggestions
  const handleSelectCurrentRole = (role: InterviewRole) => {
    setCurrentRoleId(role.id.toString());
    setCurrentRoleSearch(role.title);
    setShowCurrentSuggestions(false);
  };

  // Handle selecting a target role from suggestions
  const handleSelectTargetRole = (role: InterviewRole) => {
    setTargetRoleId(role.id.toString());
    setTargetRoleSearch(role.title);
    setShowTargetSuggestions(false);
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
                      {industries.map((industry: string) => (
                        <SelectItem key={industry} value={industry}>
                          {industry.charAt(0).toUpperCase() + industry.slice(1).replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="current-role-select">Your Current Role</Label>
                  <div className="space-y-2">
                    <div className="relative" ref={currentSearchRef}>
                      <Input
                        type="text"
                        placeholder="Search current role..."
                        value={currentRoleSearch}
                        onChange={handleCurrentRoleSearch}
                        className="mb-2"
                      />
                      {showCurrentSuggestions && filteredCurrentRoles.length > 0 && (
                        <div className="absolute w-full bg-white dark:bg-gray-900 shadow-md rounded-md border z-10 mt-1 max-h-56 overflow-y-auto">
                          {filteredCurrentRoles.slice(0, 8).map((role) => (
                            <button
                              key={role.id}
                              className="w-full text-left px-3 py-2 hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                              onClick={() => handleSelectCurrentRole(role)}
                            >
                              <div className="flex-1 truncate">
                                <div className="font-medium">{role.title}</div>
                                <div className="text-xs text-muted-foreground">{role.industry}</div>
                              </div>
                              <Badge className={getRoleTypeColor(role.roleType || "")+" text-xs"}>
                                {role.roleType}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Select value={currentRoleId} onValueChange={setCurrentRoleId}>
                      <SelectTrigger id="current-role-select">
                        <SelectValue placeholder="Select your current role" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCurrentRoles.map((role: InterviewRole) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="target-role-select">Target Role</Label>
                  <div className="space-y-2">
                    <div className="relative" ref={targetSearchRef}>
                      <Input
                        type="text"
                        placeholder="Search target role..."
                        value={targetRoleSearch}
                        onChange={handleTargetRoleSearch}
                        className="mb-2"
                      />
                      {showTargetSuggestions && filteredTargetRoles.length > 0 && (
                        <div className="absolute w-full bg-white dark:bg-gray-900 shadow-md rounded-md border z-10 mt-1 max-h-56 overflow-y-auto">
                          {filteredTargetRoles.slice(0, 8).map((role) => (
                            <button
                              key={role.id}
                              className="w-full text-left px-3 py-2 hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                              onClick={() => handleSelectTargetRole(role)}
                            >
                              <div className="flex-1 truncate">
                                <div className="font-medium">{role.title}</div>
                                <div className="text-xs text-muted-foreground">{role.industry}</div>
                              </div>
                              <Badge className={getRoleTypeColor(role.roleType || "")+" text-xs"}>
                                {role.roleType}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Select value={targetRoleId} onValueChange={setTargetRoleId}>
                      <SelectTrigger id="target-role-select">
                        <SelectValue placeholder="Select your target role" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTargetRoles.map((role: InterviewRole) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                            <CardDescription>{currentRole?.industry ? currentRole.industry.charAt(0).toUpperCase() + currentRole.industry.slice(1).replace(/_/g, ' ') : 'Unknown industry'}</CardDescription>
                          </div>
                          <Badge className={getRoleTypeColor(currentRole?.roleType || "")}>
                            {currentRole?.roleType ? currentRole.roleType.replace(/_/g, ' ') : 'Unknown role'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-4">{currentRole?.description}</p>
                        
                        {/* Market metrics removed to focus on skill gaps */}
                        
                        <div className="mt-6">
                          <h4 className="text-base font-semibold mb-3">Required Skills</h4>
                          <div className="border rounded-md p-3 bg-blue-50/50">
                            {currentRole?.requiredSkills?.map((skill, index: number) => (
                              <div key={index} className="flex items-center mb-2 last:mb-0">
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-sm font-medium">{skill}</span>
                              </div>
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
                            <CardDescription>{targetRole?.industry ? targetRole.industry.charAt(0).toUpperCase() + targetRole.industry.slice(1).replace(/_/g, ' ') : 'Unknown industry'}</CardDescription>
                          </div>
                          <Badge className={getRoleTypeColor(targetRole?.roleType || "")}>
                            {targetRole?.roleType ? targetRole.roleType.replace(/_/g, ' ') : 'Unknown role'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-4">{targetRole?.description}</p>
                        
                        {/* Market metrics removed to focus on skill gaps */}
                        
                        <div className="mt-6">
                          <h4 className="text-base font-semibold mb-3">Required Skills</h4>
                          <div className="border rounded-md p-3 bg-purple-50/50">
                            {targetRole?.requiredSkills?.map((skill, index: number) => (
                              <div key={index} className="flex items-center mb-2 last:mb-0">
                                <CheckCircle className="h-4 w-4 text-purple-600 mr-2" />
                                <span className="text-sm font-medium">{skill}</span>
                              </div>
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
                      {skillGaps.map((skill: SkillGap, index: number) => (
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