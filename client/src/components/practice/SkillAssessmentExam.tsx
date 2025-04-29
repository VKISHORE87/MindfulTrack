import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, Award, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PracticeQuestions from "./PracticeQuestions";
import QuizResult from "./QuizResult";

// Define the skill proficiency levels
export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "proficient";

export default function SkillAssessmentExam() {
  const { toast } = useToast();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [examScore, setExamScore] = useState({ score: 0, total: 0 });
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>("beginner");
  
  // User ID hardcoded for now
  const userId = 1;
  
  // Fetch all skills for the dropdown
  const { data: skills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ['/api/skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json()),
  });
  
  // Fetch assessment questions for the selected skill
  const { 
    data: assessmentData, 
    isLoading: isLoadingAssessment, 
    error: assessmentError,
    refetch: refetchAssessment
  } = useQuery({
    queryKey: ['/api/assessment/skill', selectedSkill],
    queryFn: () => selectedSkill 
      ? fetch(`/api/assessment/skill/${selectedSkill}`).then(res => res.json())
      : Promise.resolve(null),
    enabled: !!selectedSkill && !examStarted,
  });
  
  const handleSkillChange = (value: string) => {
    if (value === selectedSkill) return;
    
    setSelectedSkill(value);
    setExamStarted(false);
    setExamCompleted(false);
  };
  
  const handleStartExam = () => {
    if (!selectedSkill || !assessmentData?.questions?.length) return;
    
    setExamStarted(true);
    setExamCompleted(false);
    
    toast({
      title: "Assessment Started",
      description: `Answer all ${assessmentData.questions.length} questions to determine your proficiency level in ${assessmentData.skillName}`,
    });
  };
  
  const handleExamComplete = (score: number, totalQuestions: number) => {
    setExamCompleted(true);
    setExamScore({ score, total: totalQuestions });
    
    // Calculate proficiency level based on score percentage
    const percentage = (score / totalQuestions) * 100;
    let newLevel: ProficiencyLevel = "beginner";
    
    if (percentage >= 90) {
      newLevel = "proficient";
    } else if (percentage >= 70) {
      newLevel = "advanced";
    } else if (percentage >= 50) {
      newLevel = "intermediate";
    }
    
    setProficiencyLevel(newLevel);
    
    // Record this assessment in user's progress
    if (selectedSkill) {
      // Here you would make API call to save the assessment results
      // For now, just show a toast notification
      toast({
        title: "Assessment Completed",
        description: `Your proficiency level in ${assessmentData?.skillName}: ${newLevel.charAt(0).toUpperCase() + newLevel.slice(1)}`,
      });
    }
  };
  
  const handleResetExam = () => {
    setExamStarted(false);
    setExamCompleted(false);
    refetchAssessment();
  };
  
  const getColorForProficiencyLevel = (level: ProficiencyLevel) => {
    switch (level) {
      case "beginner": return "text-blue-500 bg-blue-50";
      case "intermediate": return "text-amber-500 bg-amber-50";
      case "advanced": return "text-purple-500 bg-purple-50";
      case "proficient": return "text-green-500 bg-green-50";
      default: return "text-gray-500 bg-gray-50";
    }
  };
  
  if (isLoadingSkills) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <p>Loading skills...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-5 w-5 text-primary" />
            Skill Assessment Exam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select a skill to assess
              </label>
              <Select value={selectedSkill || ""} onValueChange={handleSkillChange} disabled={examStarted}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a skill..." />
                </SelectTrigger>
                <SelectContent>
                  {skills?.map((skill: any) => (
                    <SelectItem key={skill.id} value={skill.id.toString()}>
                      {skill.name} ({skill.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedSkill && !examStarted && !examCompleted && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>About this assessment</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>This assessment contains {assessmentData?.questions?.length || 10} questions to evaluate your proficiency in {assessmentData?.skillName || "this skill"}.</p>
                  <p>Your result will help you track your progress and identify areas for improvement.</p>
                </AlertDescription>
              </Alert>
            )}
            
            {examCompleted && (
              <div className="rounded-lg border p-4 bg-slate-50">
                <div className="flex items-start gap-3">
                  <Award className={`h-6 w-6 mt-0.5 ${getColorForProficiencyLevel(proficiencyLevel)}`} />
                  <div>
                    <h3 className="font-semibold text-lg">Assessment Result</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Your proficiency level:
                    </p>
                    <Badge className={`${getColorForProficiencyLevel(proficiencyLevel)} border-0`}>
                      {proficiencyLevel.charAt(0).toUpperCase() + proficiencyLevel.slice(1)}
                    </Badge>
                    <p className="text-sm mt-3">
                      Score: {examScore.score} out of {examScore.total} 
                      ({Math.round((examScore.score / examScore.total) * 100)}%)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-end">
          {!examStarted && selectedSkill && (
            <Button 
              onClick={handleStartExam} 
              disabled={isLoadingAssessment || !assessmentData?.questions?.length}
              className="bg-primary hover:bg-primary-600"
            >
              {isLoadingAssessment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Questions...
                </>
              ) : (
                "Start Assessment Exam"
              )}
            </Button>
          )}
          
          {examCompleted && (
            <Button variant="outline" onClick={handleResetExam}>
              Take New Assessment
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {examStarted && !examCompleted && assessmentData?.questions?.length > 0 && (
        <>
          <Separator />
          <div className="pt-2">
            <PracticeQuestions
              questions={assessmentData.questions}
              skillId={parseInt(selectedSkill!)}
              userId={userId}
              onComplete={handleExamComplete}
            />
          </div>
        </>
      )}
    </div>
  );
}