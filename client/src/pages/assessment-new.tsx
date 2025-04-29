import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import SkillAssessmentForm from "@/components/assessment/SkillAssessmentForm";
import { BrainCircuit, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

interface InterviewRole {
  id: number;
  title: string;
  description: string;
  industry: string;
  level: string;
  role_type: string;
  required_skills: string[];
  average_salary: string;
  growth_rate: string;
  demand_score: number;
}

export default function AssessmentNew() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRoles, setFilteredRoles] = useState<InterviewRole[]>([]);
  const user = { id: 1, name: "Demo User" }; // Mock user for development 

  // Fetch all interview roles
  const { 
    data: roles = [], 
    isLoading: isLoadingRoles 
  } = useQuery<InterviewRole[]>({
    queryKey: ['/api/interview/roles'],
  });

  // When roles load or search query changes, filter the roles
  useEffect(() => {
    if (roles.length > 0) {
      if (searchQuery.trim() === "") {
        setFilteredRoles(roles);
      } else {
        const lowercaseQuery = searchQuery.toLowerCase();
        const filtered = roles.filter(role => 
          role.title.toLowerCase().includes(lowercaseQuery) ||
          role.industry.toLowerCase().includes(lowercaseQuery) ||
          role.description.toLowerCase().includes(lowercaseQuery)
        );
        setFilteredRoles(filtered);
      }
    }
  }, [roles, searchQuery]);

  // Fetch role-specific skills if a role is selected
  const { 
    data: skills = [], 
    isLoading: isLoadingSkills 
  } = useQuery<Skill[]>({
    queryKey: [selectedRoleId ? `/api/skills/role/${selectedRoleId}` : '/api/skills'],
    enabled: !!selectedRoleId, // Only run if a role is selected
  });

  // Map required_skills from the role to actual skill objects
  useEffect(() => {
    if (selectedRoleId && roles.length > 0) {
      const selectedRole = roles.find(r => r.id === selectedRoleId);
      if (selectedRole && selectedRole.required_skills && skills.length === 0) {
        // This is a fallback in case the API doesn't return skills for the role
        // You'll want to implement this API endpoint properly
        console.log("Role selected with required skills:", selectedRole.required_skills);
      }
    }
  }, [selectedRoleId, roles, skills]);

  // Fetch user skills
  const { 
    data: userSkills = null, 
    isLoading: isLoadingUserSkills 
  } = useQuery<UserSkill[] | null>({
    queryKey: [`/api/users/${user.id}/skills`],
  });

  // Set up mutation for saving career goal with selected role
  const saveCareerGoalMutation = useMutation({
    mutationFn: async (data: { userId: number, targetRoleId: number, title: string, timelineMonths: number }) => {
      const response = await apiRequest("POST", "/api/career-goals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/career-goals`] });
      toast({
        title: "Career goal saved",
        description: "Your target role has been set as your career goal",
      });
    },
    onError: () => {
      toast({
        title: "Error saving career goal",
        description: "There was an error setting your career goal",
        variant: "destructive",
      });
    }
  });

  // When a role is selected, set it as the career goal
  const handleRoleSelect = (roleId: string) => {
    const id = parseInt(roleId);
    setSelectedRoleId(id);
    
    // Save this role as a career goal
    const selectedRole = roles.find(r => r.id === id);
    if (selectedRole) {
      saveCareerGoalMutation.mutate({
        userId: user.id,
        targetRoleId: id,
        title: `Become a ${selectedRole.title}`,
        timelineMonths: 12 // Default timeline
      });
    }
  };

  const isLoading = isLoadingSkills || isLoadingUserSkills || isLoadingRoles;

  if (isLoading && !selectedRoleId) {
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
        <p className="text-gray-600">Select a target role and assess your skills to achieve your career goals.</p>
      </div>

      <div className="mt-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Target Role Selection</h3>
                <p className="text-sm text-gray-500">Choose the role you want to prepare for</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="role-search" className="mb-2 block">Search for roles</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      id="role-search"
                      placeholder="Search by title, industry, or keywords..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="role-select" className="mb-2 block">Select target role</Label>
                  <Select onValueChange={handleRoleSelect} value={selectedRoleId?.toString()}>
                    <SelectTrigger id="role-select">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRoles.map(role => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.title} ({role.industry})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedRoleId && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Selected Role Details</h4>
                  {roles.find(r => r.id === selectedRoleId) ? (
                    <div>
                      <p className="font-semibold">{roles.find(r => r.id === selectedRoleId)?.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{roles.find(r => r.id === selectedRoleId)?.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-blue-50">
                          {roles.find(r => r.id === selectedRoleId)?.industry}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50">
                          {roles.find(r => r.id === selectedRoleId)?.level}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50">
                          Avg Salary: ${roles.find(r => r.id === selectedRoleId)?.average_salary}
                        </Badge>
                        <Badge variant="outline" className="bg-amber-50">
                          Growth: {roles.find(r => r.id === selectedRoleId)?.growth_rate}%
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p>Loading role details...</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedRoleId && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Skill Self-Assessment</h3>
                  <p className="text-sm text-gray-500">Rate your current skill levels for the selected role</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                These skills are required for your target role. Rate your current proficiency level and set 
                a target level you aim to achieve.
              </p>
              
              {isLoadingSkills ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : skills.length > 0 ? (
                <SkillAssessmentForm 
                  skills={skills} 
                  userSkills={userSkills} 
                  userId={user.id} 
                />
              ) : (
                <div className="bg-amber-50 p-4 rounded border border-amber-200">
                  <p className="text-amber-800">
                    No specific skills found for this role. We're expanding our database to include more role-specific skills. 
                    You can still assess your general skills by navigating to the Skills section.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {selectedRoleId && (
          <div className="flex justify-end mt-6">
            <Button 
              className="bg-primary hover:bg-primary-700"
              onClick={() => {
                setIsGenerating(true);
                apiRequest("POST", "/api/ai/generate-learning-path", {
                  userId: user.id,
                  targetRoleId: selectedRoleId
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/learning-paths`] });
                  toast({
                    title: "Learning path generated",
                    description: "Your personalized learning path has been created based on your target role",
                  });
                  setIsGenerating(false);
                }).catch(() => {
                  toast({
                    title: "Error generating learning path",
                    description: "There was an error generating your learning path",
                    variant: "destructive",
                  });
                  setIsGenerating(false);
                });
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Path
                </>
              ) : (
                <>
                  Generate Learning Path
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}