import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Check, AlertCircle, ChevronDown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { queryClient, apiRequest } from "@/lib/queryClient";

type Role = {
  id: number;
  title: string;
  description?: string | null;
  requiredSkills?: string[] | null;
  industry?: string | null;
};

type Skill = {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  proficiencyLevel?: number;
  isRequired?: boolean;
};

type UserSkill = {
  id: number;
  userId: number;
  skillId: number;
  currentLevel: number;
  targetLevel: number;
  priority?: string | null;
  startedAt?: Date | null;
  updatedAt?: Date | null;
  skill?: {
    id: number;
    name: string;
    category: string;
    description?: string | null;
  };
};

const AssessmentNew = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [skillLevels, setSkillLevels] = useState<Record<number, number>>({});
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false);
  const [industry, setIndustry] = useState<string | null>(null);

  // Fetch all roles
  const {
    data: roles = [],
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useQuery<Role[]>({
    queryKey: ["/api/interview/roles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/interview/roles");
      return await res.json();
    },
  });

  // Fetch user skills
  const {
    data: userSkills = [],
    isLoading: isLoadingUserSkills,
    error: userSkillsError,
  } = useQuery<UserSkill[]>({
    queryKey: ["/api/users/1/skills"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/1/skills");
      return await res.json();
    },
  });

  // Fetch skills for selected role
  const {
    data: roleSkills = [],
    isLoading: isLoadingRoleSkills,
    error: roleSkillsError,
    refetch: refetchRoleSkills,
  } = useQuery<Skill[]>({
    queryKey: ["/api/skills/role", selectedRole?.id],
    queryFn: async () => {
      if (!selectedRole?.id) return [];
      const res = await apiRequest("GET", `/api/skills/role/${selectedRole.id}`);
      return await res.json();
    },
    enabled: !!selectedRole?.id,
  });

  // Save career goal mutation
  const saveCareerGoalMutation = useMutation({
    mutationFn: async (goalData: { title: string; roleId: number }) => {
      const res = await apiRequest("POST", "/api/career-goals", goalData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Career goal saved!",
        description: "Your career goal has been updated with the selected role.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save career goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save skill assessment mutation
  const saveSkillAssessmentMutation = useMutation({
    mutationFn: async (skillData: { skillId: number; currentLevel: number; targetLevel: number }[]) => {
      const res = await apiRequest("POST", "/api/users/1/skills/bulk", skillData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Skills assessment saved!",
        description: "Your skill levels have been updated.",
      });
      setIsAssessmentComplete(true);
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/skills"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save skill assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Group skills by category
  const skillsByCategory = roleSkills.reduce<Record<string, Skill[]>>((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  // Initialize skill levels from user skills
  useEffect(() => {
    if (userSkills.length > 0 && roleSkills.length > 0) {
      const initialSkillLevels: Record<number, number> = {};
      roleSkills.forEach((roleSkill) => {
        const userSkill = userSkills.find((us) => us.skillId === roleSkill.id);
        initialSkillLevels[roleSkill.id] = userSkill?.currentLevel || 0;
      });
      setSkillLevels(initialSkillLevels);
    }
  }, [userSkills, roleSkills]);

  // Additional category for Agile & Product roles
  const [showAgileOnly, setShowAgileOnly] = useState(false);

  // Filter roles based on search query, industry filter, and special filters
  useEffect(() => {
    let filtered = roles;
    
    if (industry) {
      filtered = filtered.filter(role => role.industry === industry);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(role => 
        role.title.toLowerCase().includes(query)
      );
    }
    
    // Special filter for Agile & Product Management roles
    if (showAgileOnly) {
      filtered = filtered.filter(role => isAgileOrProductRole(role));
    }
    
    setFilteredRoles(filtered);
  }, [searchQuery, roles, industry, showAgileOnly]);

  // Handle role selection
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setIsAssessmentComplete(false);
    refetchRoleSkills();
  };

  // Handle skill level change
  const handleSkillLevelChange = (skillId: number, level: number) => {
    setSkillLevels((prev) => ({
      ...prev,
      [skillId]: level,
    }));
  };

  // Save assessment
  const handleSaveAssessment = () => {
    if (!selectedRole) return;

    // Create career goal with selected role
    saveCareerGoalMutation.mutate({
      title: `Become a ${selectedRole.title}`,
      roleId: selectedRole.id,
    });

    // Save skill assessments
    const skillsToUpdate = roleSkills.map(skill => ({
      skillId: skill.id,
      currentLevel: skillLevels[skill.id] || 0,
      targetLevel: 100 // Target is always 100% for required skills
    }));

    saveSkillAssessmentMutation.mutate(skillsToUpdate);
  };

  // Get skill level description
  const getSkillLevelDescription = (level: number): string => {
    if (level < 20) return "No Experience";
    if (level < 40) return "Beginner";
    if (level < 60) return "Intermediate";
    if (level < 80) return "Advanced";
    return "Expert";
  };

  // Get skill status
  const getSkillStatus = (level: number): "missing" | "improving" | "proficient" => {
    if (level < 30) return "missing";
    if (level < 70) return "improving";
    return "proficient";
  };

  // Clear selected role
  const clearSelectedRole = () => {
    setSelectedRole(null);
    setSkillLevels({});
    setIsAssessmentComplete(false);
  };

  // Get industry options from roles
  const industries = Array.from(new Set(roles.map(role => role.industry).filter(Boolean))) as string[];
  
  // Add "Agile and Product Management" category by checking for relevant terms in titles
  const isAgileOrProductRole = (role: Role) => {
    const agileKeywords = [
      "agile", "scrum", "product", "kanban", "sprint", "program", "portfolio", 
      "coach", "master", "owner", "delivery", "transformation", "safe", "backlog",
      "release train", "iteration", "manager"
    ];
    
    // Check exact matches for specific roles from the list
    const exactAgileRoles = [
      "Scrum Master", "Product Owner", "Agile Coach", "Agile Project Manager",
      "Product Manager", "Program Manager", "Release Train Engineer", 
      "Sprint Coordinator", "Kanban Master", "Agile Transformation Lead",
      "Agile Delivery Manager", "SAFe Program Consultant", "Product Backlog Manager",
      "Agile Delivery Lead", "Product Development Manager", "Digital Product Manager",
      "Technical Product Manager", "Agile Portfolio Manager", "Enterprise Agile Coach",
      "Value Stream Manager", "Iteration Manager", "Agile Business Analyst"
    ];
    
    return agileKeywords.some(keyword => 
      role.title.toLowerCase().includes(keyword.toLowerCase())
    ) || exactAgileRoles.some(exactRole =>
      role.title === exactRole
    );
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Target Role Assessment</h1>
        <p className="text-gray-600">
          Select a target role and assess your current skill levels to create a personalized learning path.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Role selection panel */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Select Target Role</h2>
            
            <div className="space-y-4">
              {/* Industry filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Industry Filter</label>
                <Select value={industry || "all"} onValueChange={(value) => setIndustry(value === "all" ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Quick filters */}
              <div>
                <label className="block text-sm font-medium mb-1">Quick Filters</label>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm"
                    variant={showAgileOnly ? "default" : "outline"}
                    onClick={() => setShowAgileOnly(!showAgileOnly)}
                  >
                    Agile & Product
                  </Button>
                </div>
              </div>
              
              {/* Role search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search roles..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Role list */}
              <div className="h-[400px] overflow-y-auto border rounded-md">
                {isLoadingRoles ? (
                  <div className="p-4 text-center">Loading roles...</div>
                ) : rolesError ? (
                  <div className="p-4 text-center text-red-500">Error loading roles</div>
                ) : filteredRoles.length === 0 ? (
                  <div className="p-4 text-center">No roles found</div>
                ) : (
                  <ul className="divide-y">
                    {filteredRoles.map((role) => (
                      <li
                        key={role.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedRole?.id === role.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleRoleSelect(role)}
                      >
                        <div className="font-medium">{role.title}</div>
                        {role.industry && (
                          <div className="text-xs text-gray-500">{role.industry}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Assessment panel */}
        <div className="lg:col-span-2">
          {!selectedRole ? (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No Target Role Selected</h3>
              <p className="text-gray-600 mb-4">
                Please select a target role from the list to begin your assessment.
              </p>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRole.title}</h2>
                  {selectedRole.industry && (
                    <p className="text-gray-600">{selectedRole.industry}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelectedRole}
                  className="text-gray-500"
                >
                  <X className="h-4 w-4 mr-1" /> Change Role
                </Button>
              </div>

              {isAssessmentComplete ? (
                <div className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Assessment Complete!</h3>
                  <p className="text-gray-600 mb-6">
                    Your skill assessment for {selectedRole.title} has been saved.
                  </p>
                  <Button onClick={clearSelectedRole}>Assess Another Role</Button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                    <p className="text-gray-600 mb-4">
                      Rate your current skill level for each of the following skills required for this role.
                    </p>

                    {isLoadingRoleSkills ? (
                      <div className="p-4 text-center">Loading skills...</div>
                    ) : roleSkillsError ? (
                      <div className="p-4 text-center text-red-500">Error loading skills</div>
                    ) : roleSkills.length === 0 ? (
                      <div className="p-4 text-center">No skills defined for this role</div>
                    ) : (
                      <div>
                        <div className="mb-4 flex space-x-2 overflow-x-auto">
                          <Button
                            variant={activeCategory === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveCategory(null)}
                          >
                            All
                          </Button>
                          {Object.keys(skillsByCategory).map((category) => (
                            <Button
                              key={category}
                              variant={activeCategory === category ? "default" : "outline"}
                              size="sm"
                              onClick={() => setActiveCategory(category)}
                            >
                              {category}
                            </Button>
                          ))}
                        </div>

                        <Accordion type="multiple" className="space-y-4">
                          {Object.entries(skillsByCategory)
                            .filter(([category]) => activeCategory === null || activeCategory === category)
                            .map(([category, skills]) => (
                              <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                                <AccordionTrigger className="py-3">
                                  <span className="font-semibold">{category}</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-6 pt-2 pb-4">
                                    {skills.map((skill) => (
                                      <div key={skill.id} className="space-y-2">
                                        <div className="flex justify-between">
                                          <label className="font-medium text-sm">{skill.name}</label>
                                          <span 
                                            className={`text-sm font-medium ${
                                              getSkillStatus(skillLevels[skill.id] || 0) === "missing" 
                                                ? "text-red-500" 
                                                : getSkillStatus(skillLevels[skill.id] || 0) === "improving" 
                                                ? "text-amber-500" 
                                                : "text-green-500"
                                            }`}
                                          >
                                            {getSkillLevelDescription(skillLevels[skill.id] || 0)}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <Progress 
                                            value={skillLevels[skill.id] || 0} 
                                            className={`flex-1 h-2 ${
                                              getSkillStatus(skillLevels[skill.id] || 0) === "missing" 
                                                ? "bg-red-100" 
                                                : getSkillStatus(skillLevels[skill.id] || 0) === "improving" 
                                                ? "bg-amber-100" 
                                                : "bg-green-100"
                                            }`}
                                          />
                                          <span className="text-xs font-medium w-10 text-right">
                                            {skillLevels[skill.id] || 0}%
                                          </span>
                                        </div>
                                        <Slider
                                          value={[skillLevels[skill.id] || 0]}
                                          min={0}
                                          max={100}
                                          step={5}
                                          onValueChange={(value) => handleSkillLevelChange(skill.id, value[0])}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                        </Accordion>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center mt-6">
                    <Button
                      size="lg"
                      onClick={handleSaveAssessment}
                      disabled={
                        isLoadingRoleSkills || 
                        saveSkillAssessmentMutation.isPending || 
                        saveCareerGoalMutation.isPending
                      }
                    >
                      {saveSkillAssessmentMutation.isPending || saveCareerGoalMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                          Saving...
                        </div>
                      ) : (
                        "Save Assessment"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentNew;