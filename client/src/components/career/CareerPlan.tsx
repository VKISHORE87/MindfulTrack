import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Lightbulb, Award, Calendar, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Skill {
  name: string;
  status: 'missing' | 'improvement' | 'proficient';
  currentLevel: number;
  targetLevel: number;
  percentage: number;
}

interface CareerPlanProps {
  userId: number;
  careerGoalId: number;
  targetRole: string;
  skills: Skill[];
  timeline: number;
}

export default function CareerPlan({ userId, careerGoalId, targetRole, skills, timeline }: CareerPlanProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [careerPlan, setCareerPlan] = useState<any>(null);

  const generateCareerPlan = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/ai/career-plan", {
        userId,
        careerGoalId,
        targetRole,
        skills,
        timeline
      });
      
      const data = await response.json();
      setCareerPlan(data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/learning-paths`] });
      
      toast({
        title: "Career plan generated",
        description: "Your personalized career plan has been created.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was a problem generating your career plan.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Career Plan</h3>
            <p className="text-sm text-gray-500">Create a step-by-step career plan based on your skill gaps</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!careerPlan ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-6">Generate a personalized career plan to help you transition to your target role based on your skill gaps analysis.</p>
            
            <Button 
              onClick={generateCareerPlan} 
              disabled={isGenerating}
              className="w-full bg-primary hover:bg-primary-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Career Plan
                </>
              ) : (
                <>
                  Generate Career Plan
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-lg mb-2">Your Path to {targetRole}</h4>
              <p className="text-sm text-gray-600 mb-4">{careerPlan.summary}</p>
              
              <div className="flex items-center mb-4">
                <Calendar className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium">Estimated timeline: {careerPlan.estimatedMonths} months</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
                Focus Areas
              </h4>
              <div className="space-y-3">
                {careerPlan.focusAreas?.map((area: string, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{area}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Award className="h-5 w-5 text-emerald-500 mr-2" />
                Milestones
              </h4>
              <div className="space-y-4">
                {careerPlan.milestones?.map((milestone: any, index: number) => (
                  <div key={index} className="relative border-l-2 border-primary pl-4 pb-6">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
                    <h5 className="font-medium mb-1">{milestone.title}</h5>
                    <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {milestone.skills?.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-primary/10">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}