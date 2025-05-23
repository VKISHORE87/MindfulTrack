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
import { Loader2, ArrowRight, TrendingUp, DollarSign, BarChart4, CheckCircle, AlertCircle, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useCareerGoal } from "@/contexts/CareerGoalContext";

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
  status: 'missing' | 'partial' | 'proficient';
}

export default function CareerRoleComparison() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentGoal, updateCurrentGoal } = useCareerGoal();
  const [currentRoleId, setCurrentRoleId] = useState<string>("");
  const [targetRoleId, setTargetRoleId] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [currentRoleSearch, setCurrentRoleSearch] = useState<string>("");
  const [targetRoleSearch, setTargetRoleSearch] = useState<string>("");
  const [showCurrentSuggestions, setShowCurrentSuggestions] = useState<boolean>(false);
  const [showTargetSuggestions, setShowTargetSuggestions] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [isSavingGoal, setIsSavingGoal] = useState<boolean>(false);
  
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
    queryKey: [`/api/interview/roles/${currentRoleId}`],
    enabled: isComparing && !!currentRoleId,
  });

  const { data: targetRole, isLoading: isLoadingTargetRole } = useQuery<InterviewRole>({
    queryKey: [`/api/interview/roles/${targetRoleId}`],
    enabled: isComparing && !!targetRoleId,
  });
  
  // Debug log for role data
  useEffect(() => {
    if (currentRole) {
      console.log("Current Role Data:", currentRole);
      console.log("Current Role Skills:", currentRole.requiredSkills);
    }
    if (targetRole) {
      console.log("Target Role Data:", targetRole);
      console.log("Target Role Skills:", targetRole.requiredSkills);
    }
  }, [currentRole, targetRole]);

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
    
  // For target roles, include ALL roles without filtering by industry
  // This ensures the target role dropdown has the same comprehensive options as in the Assessment page
  const filteredTargetRoles = roles 
    ? roles.filter((role: InterviewRole) => {
        // Only apply search filter if provided, no industry filter
        const searchMatch = !targetRoleSearch || 
          role.title.toLowerCase().includes(targetRoleSearch.toLowerCase()) || 
          (role.description && role.description.toLowerCase().includes(targetRoleSearch.toLowerCase())) ||
          role.industry.toLowerCase().includes(targetRoleSearch.toLowerCase()) ||
          (role.roleType && role.roleType.toLowerCase().includes(targetRoleSearch.toLowerCase()));
        
        return searchMatch;
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
  // Modified to only include skills that are unique to the target role
  const calculateSkillGaps = () => {
    if (!currentRole || !targetRole) {
      console.error("Role data missing for skill gap calculation", { currentRole, targetRole });
      setSkillGaps([]);
      return;
    }

    // Get skills from both roles
    const currentSkills = Array.isArray(currentRole.requiredSkills) ? currentRole.requiredSkills : [];
    const targetSkills = Array.isArray(targetRole.requiredSkills) ? targetRole.requiredSkills : [];
    
    // Show warning if skill data isn't defined
    if (!currentSkills.length || !targetSkills.length) {
      console.warn("Missing skill data for comparison between", { 
        currentRole: currentRole.title, 
        currentSkillsLength: currentSkills.length, 
        targetRole: targetRole.title, 
        targetSkillsLength: targetSkills.length 
      });
      
      // Return empty array if no skills to compare
      if (!targetSkills.length) {
        setSkillGaps([]);
        return;
      }
    }
    
    console.log("Processing skill gaps between:", { 
      currentRole: currentRole.title, 
      currentSkills, 
      targetRole: targetRole.title, 
      targetSkills 
    });
    
    // Create an exact mapping of current skills and a case-insensitive set for more flexible matching
    const currentSkillsLowerCase = new Set<string>();
    const currentSkillsExact = new Set<string>();
    
    currentSkills.forEach(skill => {
      if (skill && typeof skill === 'string') {
        currentSkillsExact.add(skill);
        currentSkillsLowerCase.add(skill.toLowerCase());
      }
    });
    
    // Debug output
    console.log("Current Skills Set:", Array.from(currentSkillsExact));
    console.log("Current Skills Lowercase Set:", Array.from(currentSkillsLowerCase));
    
    const calculatedGaps: SkillGap[] = [];
    
    // For each target skill, check if it exists in current skills
    targetSkills.forEach(skill => {
      if (!skill || typeof skill !== 'string') return; // Skip null or undefined skills
      
      const skillName = skill;
      const requiredLevel = 90; // Assume 90% proficiency needed for target role
      
      // First try exact match, then try case-insensitive match
      const exactMatch = currentSkillsExact.has(skill);
      const caseInsensitiveMatch = currentSkillsLowerCase.has(skill.toLowerCase());
      const hasSkill = exactMatch || caseInsensitiveMatch;
      
      // Debug output for this skill
      console.log(`Checking target skill: "${skill}" - Exact match: ${exactMatch}, Case-insensitive match: ${caseInsensitiveMatch}`);
      
      // Only include skills that are not in the current role
      if (!hasSkill) {
        // Skill doesn't exist in current role - this is what we want to highlight
        const currentLevel = 30; // Baseline knowledge (30%)
        const status = 'missing';
        const gap = Math.max(0, requiredLevel - currentLevel);
        
        calculatedGaps.push({
          skillName,
          currentLevel,
          requiredLevel,
          gap,
          status
        });
      }
    });
    
    // If no gaps are found but the roles are different, add all target role skills
    // This ensures we always show the skills needed for the transition when roles are different
    if (calculatedGaps.length === 0 && targetSkills.length > 0 && currentRole.id !== targetRole.id) {
      console.log("No unique skills found between different roles. Adding all target skills.");
      
      // For transitions between different roles, we should show all target role skills
      // These are skills the user will need to focus on even if they have similar skills
      targetSkills.forEach((skill, index) => {
        if (skill && typeof skill === 'string') {
          calculatedGaps.push({
            skillName: skill,
            currentLevel: 40, // Some knowledge but needs improvement
            requiredLevel: 90,
            gap: 50,
            status: 'missing'
          });
        }
      });
    }
    
    // Sort gaps by gap size (largest first)
    calculatedGaps.sort((a, b) => b.gap - a.gap);
    
    setSkillGaps(calculatedGaps);
    
    // Debug the final result
    console.log("Final calculated skill gaps:", calculatedGaps);
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
  
  // Mutation for creating/updating career goal
  const saveGoalMutation = useMutation({
    mutationFn: async () => {
      if (!targetRole) {
        throw new Error("Target role data is not available");
      }
      
      // Check if we have an existing goal to update
      const endpoint = currentGoal 
        ? `/api/users/career-goals/${currentGoal.id}` 
        : '/api/users/career-goals';
      
      const method = currentGoal ? 'PATCH' : 'POST';
      
      // Default to 12 months timeline if creating a new goal
      const timelineMonths = currentGoal?.timelineMonths || 12;
      
      const goalData = {
        title: targetRole.title,
        targetRoleId: targetRole.id,
        timelineMonths: timelineMonths,
        description: `Career goal created from role comparison: transition to ${targetRole.title}`
      };
      
      const res = await apiRequest(method, endpoint, goalData);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save career goal');
      }
      
      return res.json();
    },
    onSuccess: async (data) => {
      // Get the goal ID from the response
      const goalId = data.id;
      
      toast({
        title: "Career goal saved",
        description: `Your target role "${targetRole?.title}" has been set as your career goal`,
      });
      
      // Set this as the current goal across the app
      if (goalId) {
        await updateCurrentGoal(goalId);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save goal",
        description: error.message || "Could not set this role as your career goal",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSavingGoal(false);
    }
  });
  
  // Handler for save career goal button
  const handleSaveCareerGoal = () => {
    if (!targetRoleId || !targetRole) {
      toast({
        title: "No target role selected",
        description: "Please select a target role first",
        variant: "destructive"
      });
      return;
    }
    
    setIsSavingGoal(true);
    saveGoalMutation.mutate();
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
                            {Array.isArray(role.requiredSkills) && role.requiredSkills.length ? 
                              ' ✓' : 
                              ' ⚠️'
                            }
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="target-role-select">Target Role <span className="text-xs text-green-600 ml-1">(includes all 188 roles)</span></Label>
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
                            {Array.isArray(role.requiredSkills) && role.requiredSkills.length ? 
                              ' ✓' : 
                              ' ⚠️'
                            }
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
                  
                  {/* Skills Gap Analysis - Merged View */}
                  <Separator />
                  
                  <div>
                    <h3 className="text-xl font-bold mb-4">Skills Gap Analysis</h3>
                    
                    {/* Role Information Cards */}
                    <div className="grid gap-6 md:grid-cols-2 mb-6">
                      {/* Current Role Info Card */}
                      <Card className="border-blue-200">
                        <CardHeader className="pb-2 bg-blue-50 border-b border-blue-200">
                          <CardTitle className="text-lg">Current Role: {currentRole?.title}</CardTitle>
                          <CardDescription>Your foundation for the transition</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="text-sm text-gray-600 mb-2">
                            <Badge className={`${getRoleTypeColor(currentRole?.roleType || "")} mr-2`}>
                              {currentRole?.roleType?.replace(/_/g, ' ')}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-800">
                              {currentRole?.industry?.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm">{currentRole?.description || "No description available"}</p>
                        </CardContent>
                      </Card>
                      
                      {/* Target Role Info Card */}
                      <Card className="border-purple-200">
                        <CardHeader className="pb-2 bg-purple-50 border-b border-purple-200">
                          <CardTitle className="text-lg">Target Role: {targetRole?.title}</CardTitle>
                          <CardDescription>Your career destination</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="text-sm text-gray-600 mb-2">
                            <Badge className={`${getRoleTypeColor(targetRole?.roleType || "")} mr-2`}>
                              {targetRole?.roleType?.replace(/_/g, ' ')}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-800">
                              {targetRole?.industry?.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm">{targetRole?.description || "No description available"}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Required Skills for Target Role - New Merged Version */}
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Required Skills for {targetRole?.title}</h4>
                      <div className="space-y-4">
                        {skillGaps.map((skill: SkillGap, index: number) => (
                          <div key={index} className="space-y-2 bg-white p-3 rounded-md border">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className={`
                                  h-2 w-2 rounded-full flex-shrink-0
                                  ${skill.status === 'missing' ? 'bg-red-500' : skill.status === 'partial' ? 'bg-yellow-500' : 'bg-green-500'}
                                `}></div>
                                <span className="font-medium">{skill.skillName}</span>
                                {skill.status === 'missing' && (
                                  <Badge variant="destructive" className="ml-2 text-xs">New Skill Needed</Badge>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                Current: {skill.currentLevel}% | Required: {skill.requiredLevel}%
                              </span>
                            </div>
                            <Progress 
                              value={skill.currentLevel} 
                              max={skill.requiredLevel} 
                              className="h-2"
                              style={{
                                backgroundColor: skill.status === 'missing' 
                                  ? 'rgba(239, 68, 68, 0.2)' 
                                  : skill.status === 'partial'
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'rgba(34, 197, 94, 0.2)'
                              }}
                            />
                            <div className="text-sm flex justify-between items-center">
                              <span className={`
                                ${skill.status === 'missing' 
                                  ? 'text-red-600' 
                                  : skill.status === 'partial' 
                                    ? 'text-amber-600' 
                                    : 'text-green-600'}
                              `}>
                                {'Priority Skill to Acquire for the ' + targetRole?.title + ' Role'}
                              </span>
                              <span className="text-orange-500 font-medium">Gap: {skill.gap}%</span>
                            </div>
                          </div>
                        ))}
                        
                        {skillGaps.length === 0 && (
                          <>
                            {(!currentRole?.requiredSkills?.length || !targetRole?.requiredSkills?.length) ? (
                              <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-gray-800 font-medium">Missing skill data for comparison</p>
                                <p className="text-gray-600 text-sm mt-2">
                                  {!currentRole?.requiredSkills?.length && "Current role has no skills defined. "}
                                  {!targetRole?.requiredSkills?.length && "Target role has no skills defined."}
                                </p>
                                <p className="text-gray-600 text-sm mt-2">Please try selecting different roles with defined skill sets.</p>
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-green-50 rounded-md border border-green-200">
                                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                <p className="text-green-800 font-medium">No Missing Skills for {targetRole?.title}</p>
                                <p className="text-green-700 text-sm mt-2">
                                  Your current role as a {currentRole?.title} already provides you with all the 
                                  required skills for the {targetRole?.title} position.
                                </p>
                                <p className="text-green-700 text-sm mt-2">
                                  We recommend continuing to develop your expertise in these shared skills to excel 
                                  in your target role.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button onClick={handleReset} variant="outline">
                      Reset
                    </Button>
                    <Button 
                      onClick={handleSaveCareerGoal} 
                      variant="secondary"
                      disabled={isSavingGoal || !targetRole}
                      className="bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                    >
                      {isSavingGoal ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving Goal
                        </>
                      ) : (
                        <>
                          <Target className="mr-2 h-4 w-4" />
                          Set As Career Goal
                        </>
                      )}
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