import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Helmet from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import PracticeQuestions from "@/components/practice/PracticeQuestions";
import QuizResult from "@/components/practice/QuizResult";
import SkillPracticeCard from "@/components/practice/SkillPracticeCard";

// Mock data for skills
const skills = [
  {
    id: 1,
    name: "JavaScript Fundamentals",
    description: "Core concepts of JavaScript including variables, functions, objects, and control flow.",
    category: "technical",
    proficiency: 0,
    questionCount: 10,
    difficulty: "beginner" as const,
  },
  {
    id: 2,
    name: "ReactJS Development",
    description: "Building user interfaces with React, including components, state management, and hooks.",
    category: "technical",
    proficiency: 0,
    questionCount: 8,
    difficulty: "intermediate" as const,
  },
  {
    id: 3,
    name: "Technical Communication",
    description: "Effectively communicate complex technical information to various audiences.",
    category: "communication",
    proficiency: 0,
    questionCount: 5,
    difficulty: "beginner" as const,
  },
  {
    id: 4,
    name: "System Architecture",
    description: "Design and implement scalable system architectures for complex applications.",
    category: "technical",
    proficiency: 0,
    questionCount: 12,
    difficulty: "advanced" as const,
  },
  {
    id: 5,
    name: "Data Analysis",
    description: "Analyze and interpret data to derive meaningful insights and make informed decisions.",
    category: "analytical",
    proficiency: 0,
    questionCount: 7,
    difficulty: "intermediate" as const,
  },
  {
    id: 6,
    name: "Project Management",
    description: "Plan, execute, and close projects effectively while managing resources and risks.",
    category: "leadership",
    proficiency: 0,
    questionCount: 9,
    difficulty: "intermediate" as const,
  },
];

// Mock data for practice questions
const questionsBySkill = {
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
    {
      id: 2,
      question: "Which of the following is NOT a primitive data type in JavaScript?",
      options: [
        { id: "a", text: "string" },
        { id: "b", text: "boolean" },
        { id: "c", text: "array" },
        { id: "d", text: "undefined" },
      ],
      correctAnswer: "c",
      explanation: "Arrays in JavaScript are objects, not primitive data types. The primitive data types are: string, number, boolean, null, undefined, symbol, and bigint.",
      skillId: 1,
      difficulty: "beginner" as const,
    },
    {
      id: 3,
      question: "What does the '===' operator do in JavaScript?",
      options: [
        { id: "a", text: "Checks for equality, performing type coercion" },
        { id: "b", text: "Checks for equality without type coercion" },
        { id: "c", text: "Assigns a value to a variable" },
        { id: "d", text: "Checks if one value is greater than another" },
      ],
      correctAnswer: "b",
      explanation: "The '===' operator is the strict equality operator in JavaScript. It checks for equality without type coercion, meaning it returns true only if both the value and type are the same.",
      skillId: 1,
      difficulty: "beginner" as const,
    },
  ],
  2: [
    {
      id: 4,
      question: "What hook would you use to run a side effect in a functional component?",
      options: [
        { id: "a", text: "useState" },
        { id: "b", text: "useEffect" },
        { id: "c", text: "useContext" },
        { id: "d", text: "useReducer" },
      ],
      correctAnswer: "b",
      explanation: "The useEffect hook is used to perform side effects in functional components. Side effects could include data fetching, subscriptions, or manually changing the DOM.",
      skillId: 2,
      difficulty: "intermediate" as const,
    },
    {
      id: 5,
      question: "Which of the following is NOT a rule of React hooks?",
      options: [
        { id: "a", text: "Only call hooks at the top level" },
        { id: "b", text: "Only call hooks from React components" },
        { id: "c", text: "Hooks can be used inside class components" },
        { id: "d", text: "Custom hooks should start with 'use'" },
      ],
      correctAnswer: "c",
      explanation: "Hooks cannot be used inside class components. They're designed to be used only in functional components.",
      skillId: 2,
      difficulty: "intermediate" as const,
    },
  ],
  3: [
    {
      id: 6,
      question: "When explaining a technical concept to a non-technical audience, it's best to:",
      options: [
        { id: "a", text: "Use as much technical jargon as possible to sound professional" },
        { id: "b", text: "Use analogies and simple language to make it relatable" },
        { id: "c", text: "Speak quickly to cover all technical details" },
        { id: "d", text: "Avoid explaining details since they won't understand anyway" },
      ],
      correctAnswer: "b",
      explanation: "When communicating with non-technical audiences, using analogies and simple language helps make complex concepts more accessible and relatable.",
      skillId: 3,
      difficulty: "beginner" as const,
    },
  ],
  4: [
    {
      id: 7,
      question: "Which architectural pattern organizes an application into three interconnected components: Model, View, and Controller?",
      options: [
        { id: "a", text: "Microservices" },
        { id: "b", text: "Event-Driven Architecture" },
        { id: "c", text: "MVC" },
        { id: "d", text: "SOA" },
      ],
      correctAnswer: "c",
      explanation: "MVC (Model-View-Controller) is an architectural pattern that separates an application into three main components: the Model (data), the View (user interface), and the Controller (business logic).",
      skillId: 4,
      difficulty: "intermediate" as const,
    },
  ],
  5: [
    {
      id: 8,
      question: "What statistical measure represents the middle value in a data set?",
      options: [
        { id: "a", text: "Mean" },
        { id: "b", text: "Median" },
        { id: "c", text: "Mode" },
        { id: "d", text: "Range" },
      ],
      correctAnswer: "b",
      explanation: "The median is the middle value in a data set when the values are arranged in order. If there's an even number of observations, the median is the average of the two middle values.",
      skillId: 5,
      difficulty: "beginner" as const,
    },
  ],
  6: [
    {
      id: 9,
      question: "What is the main purpose of a project kickoff meeting?",
      options: [
        { id: "a", text: "To celebrate the project's completion" },
        { id: "b", text: "To introduce team members and align on project goals and expectations" },
        { id: "c", text: "To divide the budget among team members" },
        { id: "d", text: "To assign blame for potential failures" },
      ],
      correctAnswer: "b",
      explanation: "A project kickoff meeting brings all stakeholders together to introduce team members, clarify roles and responsibilities, align on project goals, and set expectations for communication and deliverables.",
      skillId: 6,
      difficulty: "beginner" as const,
    },
  ]
};

export default function PracticePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState({ score: 0, total: 0 });
  
  // Fake user ID for now
  const userId = 1;
  
  // Filter skills based on the active tab
  const filteredSkills = skills.filter(skill => 
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
    // This would typically be an API call to update the user's progress
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
  
  const selectedSkillData = selectedSkill 
    ? skills.find(skill => skill.id === selectedSkill) 
    : null;
    
  const questions = selectedSkill 
    ? questionsBySkill[selectedSkill as keyof typeof questionsBySkill] || []
    : [];
  
  return (
    <>
      <Helmet>
        <title>Practice Skills | Skill Development Platform</title>
      </Helmet>
      
      <div className="container py-8">
        {!selectedSkill ? (
          <>
            <PageHeader 
              heading="Practice Skills" 
              subheading="Test your knowledge and reinforce your learning with interactive practice exercises"
            />
            
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
                  {filteredSkills.map(skill => (
                    <SkillPracticeCard
                      key={skill.id}
                      id={skill.id}
                      name={skill.name}
                      description={skill.description}
                      category={skill.category}
                      questionCount={skill.questionCount}
                      difficulty={skill.difficulty}
                      onPractice={handlePracticeClick}
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
