import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import SkillAssessmentForm from "@/components/assessment/SkillAssessmentForm";
import { BrainCircuit, Loader2 } from "lucide-react";

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

interface CareerGoal {
  id: number;
  title: string;
  timeline: string;
  targetRoleId?: string;
  timelineMonths?: number;
  readiness: number;
}

export default function Assessment({ user }: { user: User }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user career goals
  const { 
    data: careerGoals = [], 
    isLoading: isLoadingCareerGoals 
  } = useQuery<CareerGoal[]>({
    queryKey: [`/api/users/${user.id}/career-goals`],
  });
  
  // Determine if we have a targetRoleId to fetch skills for
  // Parse the targetRoleId as a number to ensure consistent type across the application
  const targetRoleId = careerGoals[0]?.targetRoleId ? parseInt(careerGoals[0].targetRoleId.toString()) : undefined;
  
  // Fetch role-specific skills if a role is set, otherwise fetch all skills
  const { 
    data: skills = [], 
    isLoading: isLoadingSkills 
  } = useQuery<Skill[]>({
    queryKey: [
      targetRoleId 
        ? `/api/skills/role/${targetRoleId}` 
        : '/api/skills'
    ],
    enabled: !isLoadingCareerGoals, // Only run after career goals are loaded
  });

  // Fetch user skills
  const { 
    data: userSkills = null, 
    isLoading: isLoadingUserSkills 
  } = useQuery<UserSkill[] | null>({
    queryKey: [`/api/users/${user.id}/skills`],
  });

  const isLoading = isLoadingSkills || isLoadingUserSkills || isLoadingCareerGoals;

  if (isLoading) {
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
        <p className="text-gray-600">Assess your skills to achieve your career goals.</p>
      </div>

      <div className="mt-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Skill Self-Assessment</h3>
                <p className="text-sm text-gray-500">Rate your current skill levels and set target goals</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {targetRoleId ? (
              <p className="mb-6">
                These skills are required for your target role. Rate your current proficiency level and set 
                a target level you aim to achieve.
              </p>
            ) : (
              <p className="mb-6">
                For each skill, rate your current proficiency level and set a target level you aim to achieve. 
                This will help us create a personalized learning path.
              </p>
            )}
            
            <SkillAssessmentForm 
              skills={skills} 
              userSkills={userSkills} 
              userId={user.id} 
            />
          </CardContent>
        </Card>
        
        <div className="flex justify-end mt-6">
          <Button 
            className="bg-primary hover:bg-primary-700"
            onClick={() => {
              if (careerGoals.length === 0) {
                toast({
                  title: "No career goal set",
                  description: "Please set a career goal first to generate a learning path.",
                  variant: "destructive",
                });
                return;
              }
              
              setIsGenerating(true);
              apiRequest("POST", "/api/ai/generate-learning-path", {
                userId: user.id,
                careerGoalId: careerGoals[0].id
              }).then(() => {
                queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/learning-paths`] });
                toast({
                  title: "Learning path generated",
                  description: "Your personalized learning path has been created",
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
      </div>
    </div>
  );
}