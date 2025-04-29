import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Helmet from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import PracticeQuestions from "@/components/practice/PracticeQuestions";
import QuizResult from "@/components/practice/QuizResult";
import SkillPracticeCard from "@/components/practice/SkillPracticeCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";

// Fallback data for practice questions - only used when no better data is available
const defaultSkills = [
  {
    id: 1,
    name: "JavaScript Fundamentals",
    description: "Core concepts of JavaScript including variables, functions, objects, and control flow.",
    category: "technical",
    proficiency: 0,
    questionCount: 10,
    difficulty: "beginner" as const,
  },
  // Other fallback skills removed for brevity
];

// Default questions - only used when no better data is available
const defaultQuestionsBySkill = {
  1: [
    {
      id: 1,
      question: "What is the output of: console.log(typeof NaN)?",
      options: [
        { id: "a", text: "undefined" },
        { id: "b", text: "object" },
        { id: "c", text: "number" },
        { id: "d", text: "NaN" },
      ],
      correctAnswer: "c",
      explanation: "In JavaScript, NaN (Not a Number) is actually a special value of the Number type. Therefore, typeof NaN returns 'number'.",
      skillId: 1,
      difficulty: "beginner" as const,
    },
    // Other questions removed for brevity
  ]
};

export default function PracticePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState({ score: 0, total: 0 });
  
  // User ID for now is hard-coded
  const userId = 1;

  // Get the user's career goals to find target role ID
  const { data: careerGoals, isLoading: isLoadingGoals } = useQuery({
    queryKey: ["/api/users", userId, "career-goals"],
    queryFn: () => fetch(`/api/users/${userId}/career-goals`).then(res => res.json()),
  });

  const primaryCareerGoal = careerGoals?.length > 0 ? careerGoals[0] : null;
  const targetRoleId = primaryCareerGoal?.targetRoleId;

  // Get role-based practice content if we have a target role
  const { 
    data: rolePracticeData,
    isLoading: isLoadingRolePractice,
    error: rolePracticeError,
    refetch: refetchRolePractice
  } = useQuery({
    queryKey: ["/api/practice/role", targetRoleId],
    queryFn: () => targetRoleId 
      ? fetch(`/api/practice/role/${targetRoleId}`).then(res => res.json())
      : Promise.resolve(null),
    enabled: !!targetRoleId,
  });

  // Use either role-based skills or default skills
  const skills = rolePracticeData?.skills || defaultSkills;
  
  // Filter skills based on the active tab
  const filteredSkills = skills.filter((skill: any) => 
    activeTab === "all" || skill.category === activeTab
  );
  
  const handlePracticeClick = (skillId: number) => {
    setSelectedSkill(skillId);
    setQuizCompleted(false);
  };
  
  const handleQuizComplete = (score: number, totalQuestions: number) => {
    setQuizScore({ score, total: totalQuestions });
    setQuizCompleted(true);
    
    // Record this practice session in user's activity
    toast({
      title: "Practice session recorded",
      description: `You scored ${score} out of ${totalQuestions}`,
    });
  };
  
  const handleRetry = () => {
    setQuizCompleted(false);
  };
  
  const handleFinish = () => {
    setSelectedSkill(null);
    setQuizCompleted(false);
  };

  const handleRefreshRolePractice = () => {
    refetchRolePractice();
    toast({
      title: "Refreshing practice content",
      description: "Updating practice exercises for your target role",
    });
  };
  
  // Find selected skill and its questions
  const selectedSkillData = selectedSkill 
    ? skills.find((skill: any) => skill.id === selectedSkill) 
    : null;
    
  const questions = selectedSkill 
    ? (selectedSkillData?.questions || defaultQuestionsBySkill[1] || [])
    : [];

  // Determine if we're showing role-specific practice
  const hasRoleSpecificContent = !!rolePracticeData;
  const roleName = primaryCareerGoal?.title || (hasRoleSpecificContent ? rolePracticeData.roleTitle : null);
  
  return (
    <>
      <Helmet>
        <title>Practice Skills | Skill Development Platform</title>
      </Helmet>
      
      <div className="container py-8">
        {!selectedSkill ? (
          <>
            <div className="flex justify-between items-start">
              <PageHeader 
                heading="Practice Skills" 
                subheading="Test your knowledge and reinforce your learning with interactive practice exercises"
              />
              
              {targetRoleId && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleRefreshRolePractice}
                  disabled={isLoadingRolePractice}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRolePractice ? 'animate-spin' : ''}`} />
                  {isLoadingRolePractice ? 'Refreshing...' : 'Refresh Content'}
                </Button>
              )}
            </div>
            
            {targetRoleId && roleName && (
              <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <TargetIcon className="h-5 w-5 mr-2 text-primary" />
                    Target Role Practice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm flex items-center">
                    <span>Displaying practice exercises for the role:</span>
                    <Badge variant="outline" className="ml-1 font-semibold">{roleName}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    These exercises are designed to help you build the skills needed for your target career goal.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {rolePracticeError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Practice Content</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>There was a problem loading practice exercises for your target role.</p>
                  <Button 
                    onClick={handleRefreshRolePractice}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Try Again
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {isLoadingRolePractice && targetRoleId && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
                <p>Loading role-specific practice content...</p>
              </div>
            )}
            
            {(!isLoadingRolePractice || !targetRoleId) && (
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-8">
                <TabsList className="mb-8">
                  <TabsTrigger value="all">All Skills</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="communication">Communication</TabsTrigger>
                  <TabsTrigger value="analytical">Analytical</TabsTrigger>
                  <TabsTrigger value="leadership">Leadership</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSkills.map((skill: any) => (
                      <SkillPracticeCard
                        key={skill.id}
                        id={skill.id}
                        name={skill.name}
                        description={skill.description}
                        category={skill.category}
                        questionCount={skill.questions?.length || skill.questionCount || 3}
                        difficulty={skill.difficulty}
                        onPractice={handlePracticeClick}
                        targetRole={skill.forTargetRole}
                      />
                    ))}
                  </div>
                  
                  {filteredSkills.length === 0 && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium mb-2">No skills found in this category</h3>
                      <p className="text-gray-500">Try selecting a different category or add new skills to your profile</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        ) : (
          <div className="max-w-3xl mx-auto">
            <button 
              onClick={handleFinish}
              className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6"
            >
              ← Back to Skills
            </button>
            
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">
                {selectedSkillData?.name}
              </h1>
              <p className="text-gray-600">
                {selectedSkillData?.description}
              </p>
              
              {selectedSkillData?.forTargetRole && (
                <Badge className="mt-3 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  For {selectedSkillData.forTargetRole} Role
                </Badge>
              )}
            </div>
            
            <Separator className="mb-8" />
            
            {!quizCompleted ? (
              questions.length > 0 ? (
                <PracticeQuestions
                  questions={questions}
                  skillId={selectedSkill}
                  userId={userId}
                  onComplete={handleQuizComplete}
                />
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No practice questions available</h3>
                  <p className="text-gray-500">We're still developing questions for this skill</p>
                </div>
              )
            ) : (
              <QuizResult
                score={quizScore.score}
                totalQuestions={quizScore.total}
                skillName={selectedSkillData?.name || ""}
                onRetry={handleRetry}
                onFinish={handleFinish}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
