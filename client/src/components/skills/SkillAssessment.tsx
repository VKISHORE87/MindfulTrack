import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  BookOpen,
  Clock,
  AlertTriangle,
  ChevronRight,
  Cpu,
  Code,
  BarChart4,
  Layers,
  Users,
  Briefcase
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define skill assessment structure
interface AssessmentQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  type: 'multiple-choice' | 'coding' | 'practical' | 'self-assessment';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hint?: string;
}

interface SkillAssessment {
  skillId: number;
  skillName: string;
  category: string;
  description: string;
  proficiencyLevels: {
    beginner: string;
    intermediate: string;
    advanced: string;
    expert: string;
  };
  questions: AssessmentQuestion[];
}

interface UserSkill {
  id: number;
  skillId: number;
  userId: number;
  currentLevel: number;
  targetLevel: number;
  notes?: string;
  lastAssessed?: string;
}

// Sample skill assessments
const SAMPLE_ASSESSMENTS: SkillAssessment[] = [
  {
    skillId: 1,
    skillName: "JavaScript",
    category: "technical",
    description: "Core programming language for web development with a focus on front-end interactivity.",
    proficiencyLevels: {
      beginner: "Basic syntax, variables, functions, and simple DOM manipulation",
      intermediate: "Async programming, ES6 features, frameworks basics",
      advanced: "Advanced patterns, performance optimization, framework mastery",
      expert: "Creating libraries, teaching others, complex system architecture"
    },
    questions: [
      {
        id: "js1",
        question: "Which of the following is NOT a JavaScript data type?",
        options: ["String", "Boolean", "Float", "Symbol"],
        correctAnswer: "Float",
        type: "multiple-choice",
        difficulty: "beginner"
      },
      {
        id: "js2",
        question: "What will be the output of: console.log(typeof [])?",
        options: ["array", "object", "undefined", "Array"],
        correctAnswer: "object",
        type: "multiple-choice",
        difficulty: "beginner"
      },
      {
        id: "js3",
        question: "Explain the concept of closures in JavaScript and provide an example of their practical use.",
        type: "self-assessment",
        difficulty: "intermediate"
      },
      {
        id: "js4",
        question: "Write a function that debounces another function to be called after a specific delay.",
        type: "coding",
        difficulty: "advanced",
        hint: "You'll need to use setTimeout and clearTimeout"
      },
      {
        id: "js5",
        question: "How would you optimize a JavaScript application that's experiencing performance issues?",
        type: "self-assessment",
        difficulty: "advanced"
      }
    ]
  },
  {
    skillId: 2,
    skillName: "Product Management",
    category: "business",
    description: "Strategic product planning, development, and lifecycle management to deliver customer value.",
    proficiencyLevels: {
      beginner: "Understands basic product concepts, assists with research",
      intermediate: "Manages backlog, writes user stories, works with stakeholders",
      advanced: "Sets strategy, leads cross-functional teams, drives metrics",
      expert: "Oversees complex product suites, mentors teams, drives innovation"
    },
    questions: [
      {
        id: "pm1",
        question: "What is the primary purpose of a product roadmap?",
        options: [
          "To list all features that will be built", 
          "To provide strategic direction and communicate product vision and progress", 
          "To track development team velocity", 
          "To set deadlines for marketing campaigns"
        ],
        correctAnswer: "To provide strategic direction and communicate product vision and progress",
        type: "multiple-choice",
        difficulty: "beginner"
      },
      {
        id: "pm2",
        question: "What's the difference between a product vision and a product strategy?",
        type: "self-assessment",
        difficulty: "intermediate"
      },
      {
        id: "pm3",
        question: "You have conflicting feature requests from two major customers. How would you prioritize which one to implement first?",
        type: "self-assessment",
        difficulty: "intermediate"
      },
      {
        id: "pm4",
        question: "Describe how you would validate a new product idea before committing significant development resources.",
        type: "self-assessment",
        difficulty: "advanced"
      },
      {
        id: "pm5",
        question: "For a given product feature, create a comprehensive set of user stories with acceptance criteria.",
        type: "practical",
        difficulty: "advanced"
      }
    ]
  },
  {
    skillId: 3,
    skillName: "Data Analysis",
    category: "analytical",
    description: "Extracting, interpreting, and presenting insights from data to drive business decisions.",
    proficiencyLevels: {
      beginner: "Basic data querying, spreadsheet skills, simple visualizations",
      intermediate: "Statistical methods, ETL processes, advanced SQL, dashboarding",
      advanced: "Predictive modeling, complex data architecture, multi-source analysis",
      expert: "Leading data strategy, advanced modeling, machine learning integration"
    },
    questions: [
      {
        id: "da1",
        question: "Which of these is NOT a common data visualization type?",
        options: ["Bar chart", "Pie chart", "Recursive plot", "Scatter plot"],
        correctAnswer: "Recursive plot",
        type: "multiple-choice",
        difficulty: "beginner"
      },
      {
        id: "da2",
        question: "What SQL clause would you use to filter results after aggregation?",
        options: ["WHERE", "HAVING", "FILTER", "GROUP BY"],
        correctAnswer: "HAVING",
        type: "multiple-choice",
        difficulty: "intermediate"
      },
      {
        id: "da3",
        question: "Explain the difference between correlation and causation with an example.",
        type: "self-assessment",
        difficulty: "intermediate"
      },
      {
        id: "da4",
        question: "Given a dataset with customer purchases, write the SQL query that would identify the top 10% of customers by total spend.",
        type: "coding",
        difficulty: "advanced"
      },
      {
        id: "da5",
        question: "How would you approach building a dashboard to track key performance indicators for an e-commerce business?",
        type: "self-assessment",
        difficulty: "advanced"
      }
    ]
  },
  {
    skillId: 4,
    skillName: "Leadership",
    category: "leadership",
    description: "Guiding and influencing individuals and teams toward achieving organizational goals.",
    proficiencyLevels: {
      beginner: "Leads by example, effective communicator, supports team members",
      intermediate: "Delegates effectively, resolves conflicts, provides constructive feedback",
      advanced: "Develops leaders, creates vision, drives organizational change",
      expert: "Strategic leadership, builds high-performance culture, influences industry"
    },
    questions: [
      {
        id: "ld1",
        question: "Which leadership style involves making decisions without consulting team members?",
        options: ["Democratic", "Autocratic", "Laissez-faire", "Transformational"],
        correctAnswer: "Autocratic",
        type: "multiple-choice",
        difficulty: "beginner"
      },
      {
        id: "ld2",
        question: "Describe a situation where you had to adapt your leadership style to meet the needs of a team or situation.",
        type: "self-assessment",
        difficulty: "intermediate"
      },
      {
        id: "ld3",
        question: "How would you approach providing difficult feedback to a team member who is underperforming?",
        type: "self-assessment",
        difficulty: "intermediate"
      },
      {
        id: "ld4",
        question: "Outline your strategy for building trust within a newly formed team with diverse backgrounds and working styles.",
        type: "self-assessment",
        difficulty: "advanced"
      },
      {
        id: "ld5",
        question: "Describe how you would lead an organization through a significant change or transformation.",
        type: "self-assessment",
        difficulty: "advanced"
      }
    ]
  },
  {
    skillId: 5,
    skillName: "UI/UX Design",
    category: "design",
    description: "Creating intuitive, accessible, and engaging user interfaces and experiences.",
    proficiencyLevels: {
      beginner: "Basic design principles, wireframing, simple prototypes",
      intermediate: "User research, interaction design, usability testing",
      advanced: "Design systems, complex workflows, accessibility expertise",
      expert: "Leading design strategy, innovation in interaction patterns"
    },
    questions: [
      {
        id: "ux1",
        question: "What is the primary difference between UI and UX design?",
        options: [
          "UI is about visual elements, UX covers the entire user experience", 
          "UI is for websites, UX is for mobile apps", 
          "UI is technical, UX is creative", 
          "There is no difference"
        ],
        correctAnswer: "UI is about visual elements, UX covers the entire user experience",
        type: "multiple-choice",
        difficulty: "beginner"
      },
      {
        id: "ux2",
        question: "What is the purpose of a user persona in the design process?",
        options: [
          "To create fictional characters for marketing", 
          "To represent user types and guide design decisions", 
          "To showcase diversity in promotional materials", 
          "To test the product before launch"
        ],
        correctAnswer: "To represent user types and guide design decisions",
        type: "multiple-choice",
        difficulty: "intermediate"
      },
      {
        id: "ux3",
        question: "Explain the concept of information architecture and why it's important.",
        type: "self-assessment",
        difficulty: "intermediate"
      },
      {
        id: "ux4",
        question: "How would you design an interface that needs to serve both novice and expert users?",
        type: "self-assessment",
        difficulty: "advanced"
      },
      {
        id: "ux5",
        question: "Critique the UI/UX of a digital product you use regularly, identifying strengths and areas for improvement.",
        type: "practical",
        difficulty: "advanced"
      }
    ]
  }
];

const SkillAssessment = () => {
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<SkillAssessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [feedbackDetails, setFeedbackDetails] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all skills
  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['/api/skills'],
    queryFn: async () => {
      const res = await fetch('/api/skills');
      if (!res.ok) {
        throw new Error('Failed to fetch skills');
      }
      return res.json();
    }
  });

  // Fetch user skills
  const { data: userSkills, isLoading: userSkillsLoading } = useQuery({
    queryKey: ['/api/users/skills'],
    queryFn: async () => {
      const res = await fetch('/api/users/skills');
      if (!res.ok) {
        throw new Error('Failed to fetch user skills');
      }
      return res.json();
    }
  });

  // For now, we're using the sample assessments
  // In a real implementation, this would be fetched from the API
  useEffect(() => {
    if (selectedSkillId) {
      const assessment = SAMPLE_ASSESSMENTS.find(a => a.skillId === selectedSkillId);
      if (assessment) {
        setCurrentAssessment(assessment);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setAssessmentComplete(false);
        setAssessmentScore(null);
        setFeedbackDetails([]);
      }
    }
  }, [selectedSkillId]);

  // Map skill categories to icons
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical':
        return <Code className="h-5 w-5" />;
      case 'analytical':
        return <BarChart4 className="h-5 w-5" />;
      case 'business':
        return <Briefcase className="h-5 w-5" />;
      case 'leadership':
        return <Users className="h-5 w-5" />;
      case 'design':
        return <Layers className="h-5 w-5" />;
      default:
        return <Cpu className="h-5 w-5" />;
    }
  };

  // Submit an answer for the current question
  const handleAnswerSubmit = (answer: string) => {
    if (!currentAssessment) return;
    
    const currentQuestion = currentAssessment.questions[currentQuestionIndex];
    
    // Save the answer
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
    
    // Move to next question or complete the assessment
    if (currentQuestionIndex < currentAssessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeAssessment();
    }
  };

  // Calculate assessment results
  const completeAssessment = () => {
    if (!currentAssessment) return;
    
    let correctAnswers = 0;
    let totalAnswerable = 0;
    const feedback: string[] = [];
    
    currentAssessment.questions.forEach(question => {
      if (question.type === 'multiple-choice' && question.correctAnswer) {
        totalAnswerable++;
        if (userAnswers[question.id] === question.correctAnswer) {
          correctAnswers++;
          feedback.push(`✓ ${question.question}: Correct`);
        } else {
          feedback.push(`✗ ${question.question}: Incorrect (Your answer: ${userAnswers[question.id] || 'Not answered'}, Correct answer: ${question.correctAnswer})`);
        }
      } else if (['coding', 'practical', 'self-assessment'].includes(question.type)) {
        feedback.push(`• ${question.question}: Your response will be reviewed`);
      }
    });
    
    const score = totalAnswerable > 0 ? Math.round((correctAnswers / totalAnswerable) * 100) : null;
    
    setAssessmentScore(score);
    setFeedbackDetails(feedback);
    setAssessmentComplete(true);

    // Show completion toast
    toast({
      title: "Assessment Complete",
      description: score !== null ? `You scored ${score}% on the multiple-choice questions.` : "Your assessment has been submitted for review.",
    });

    // In a real implementation, we would save the assessment results to the backend
    // For now, we'll just simulate updating the user's skill level
    if (currentAssessment && score !== null) {
      const skillLevel = score >= 80 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;
      // This would be a mutation to update the user's skill level
      console.log(`[INFO] User skill level for ${currentAssessment.skillName} updated to ${skillLevel}`);
    }
  };

  // Reset the assessment
  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setAssessmentComplete(false);
    setAssessmentScore(null);
    setFeedbackDetails([]);
  };

  // Render the current question
  const renderQuestion = () => {
    if (!currentAssessment) return null;
    const question = currentAssessment.questions[currentQuestionIndex];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Badge variant={
            question.difficulty === 'beginner' ? 'outline' :
            question.difficulty === 'intermediate' ? 'secondary' : 'destructive'
          }>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {currentAssessment.questions.length}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold">{question.question}</h3>
        
        {question.type === 'multiple-choice' && question.options && (
          <RadioGroup 
            value={userAnswers[question.id] || ""} 
            onValueChange={(value) => handleAnswerSubmit(value)}
          >
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
        
        {question.type === 'coding' && (
          <div className="space-y-2">
            <Textarea 
              placeholder="Write your code here..."
              className="font-mono h-36"
              value={userAnswers[question.id] || ""}
              onChange={(e) => setUserAnswers(prev => ({
                ...prev,
                [question.id]: e.target.value
              }))}
            />
            {question.hint && (
              <div className="flex items-start rounded-md bg-muted p-3">
                <HelpCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Hint</div>
                  <div className="text-muted-foreground">{question.hint}</div>
                </div>
              </div>
            )}
            <Button 
              className="mt-2" 
              onClick={() => handleAnswerSubmit(userAnswers[question.id] || "")}
              disabled={!userAnswers[question.id]}
            >
              Submit Answer
            </Button>
          </div>
        )}
        
        {['practical', 'self-assessment'].includes(question.type) && (
          <div className="space-y-2">
            <Textarea 
              placeholder="Write your response here..."
              className="h-36"
              value={userAnswers[question.id] || ""}
              onChange={(e) => setUserAnswers(prev => ({
                ...prev,
                [question.id]: e.target.value
              }))}
            />
            <Button 
              className="mt-2" 
              onClick={() => handleAnswerSubmit(userAnswers[question.id] || "")}
              disabled={!userAnswers[question.id]}
            >
              Submit Response
            </Button>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Progress 
            value={((currentQuestionIndex + 1) / currentAssessment.questions.length) * 100} 
            className="w-1/2" 
          />
          <Button
            variant="outline"
            onClick={() => {
              if (currentQuestionIndex < currentAssessment.questions.length - 1) {
                // If current question is not answered, prompt user
                const currentQId = currentAssessment.questions[currentQuestionIndex].id;
                if (!userAnswers[currentQId]) {
                  if (confirm("You haven't answered this question. Continue anyway?")) {
                    setCurrentQuestionIndex(prev => prev + 1);
                  }
                } else {
                  setCurrentQuestionIndex(prev => prev + 1);
                }
              } else {
                completeAssessment();
              }
            }}
            disabled={currentQuestionIndex === currentAssessment.questions.length - 1 && assessmentComplete}
          >
            {currentQuestionIndex === currentAssessment.questions.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    );
  };

  // Render assessment results
  const renderResults = () => {
    if (!currentAssessment || !assessmentComplete) return null;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Assessment Complete</h2>
          {assessmentScore !== null ? (
            <div className="mt-2">
              <span className="text-3xl font-bold">{assessmentScore}%</span>
              <span className="text-muted-foreground ml-2">Score</span>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Your responses to the open-ended questions have been recorded.
            </p>
          )}
        </div>
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-semibold mb-2">Skill Proficiency Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your responses, here's an assessment of your proficiency in {currentAssessment.skillName}:
          </p>
          
          {assessmentScore !== null && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Beginner</span>
                <span>Expert</span>
              </div>
              <Progress 
                value={assessmentScore} 
                className="h-3" 
              />
              <div className="mt-2">
                <Badge variant={
                  assessmentScore >= 80 ? 'default' :
                  assessmentScore >= 60 ? 'secondary' :
                  assessmentScore >= 40 ? 'outline' : 'destructive'
                }>
                  {assessmentScore >= 80 ? 'Advanced / Expert' :
                   assessmentScore >= 60 ? 'Intermediate / Advanced' :
                   assessmentScore >= 40 ? 'Beginner / Intermediate' : 'Beginner'}
                </Badge>
              </div>
              <div className="text-sm mt-2">
                <div className="font-medium">Suggested next steps:</div>
                <ul className="list-disc list-inside text-muted-foreground">
                  {assessmentScore >= 80 ? (
                    <>
                      <li>Consider mentoring others in this skill</li>
                      <li>Explore advanced applications and leadership opportunities</li>
                      <li>Contribute to the community through content creation</li>
                    </>
                  ) : assessmentScore >= 60 ? (
                    <>
                      <li>Focus on the advanced topics you found challenging</li>
                      <li>Apply this skill in more complex real-world scenarios</li>
                      <li>Consider specialization in related sub-domains</li>
                    </>
                  ) : assessmentScore >= 40 ? (
                    <>
                      <li>Strengthen your understanding of core concepts</li>
                      <li>Practice through guided exercises and projects</li>
                      <li>Explore intermediate learning resources</li>
                    </>
                  ) : (
                    <>
                      <li>Focus on building a strong foundation</li>
                      <li>Complete beginner-friendly tutorials and courses</li>
                      <li>Practice with simple, guided exercises</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          {feedbackDetails.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Detailed Feedback</h4>
              <div className="text-sm space-y-2">
                {feedbackDetails.map((feedback, index) => (
                  <div key={index} className="flex items-start">
                    {feedback.startsWith('✓') ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                    ) : feedback.startsWith('✗') ? (
                      <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 shrink-0" />
                    )}
                    <span>{feedback.substring(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setSelectedSkillId(null)}
          >
            Choose Another Skill
          </Button>
          <Button onClick={handleReset}>
            Retake Assessment
          </Button>
        </div>
      </div>
    );
  };

  // Render skill selection UI
  const renderSkillSelection = () => {
    // For demo purposes, we're filtering the SAMPLE_ASSESSMENTS
    // In a real implementation, we would filter the data from the API
    const filteredSkills = SAMPLE_ASSESSMENTS.filter(skill => {
      if (difficultyFilter === "all") return true;
      
      // Find user skill to determine if it's a match based on gap
      const userSkill = userSkills?.find((us: UserSkill) => us.skillId === skill.skillId);
      if (!userSkill) return true; // If no user skill, show all
      
      const gap = userSkill.targetLevel - userSkill.currentLevel;
      
      if (difficultyFilter === "gap-high" && gap >= 2) return true;
      if (difficultyFilter === "gap-medium" && gap === 1) return true;
      if (difficultyFilter === "gap-none" && gap <= 0) return true;
      
      return false;
    });
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Skill Readiness Assessments</h2>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by skill gap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              <SelectItem value="gap-high">High Skill Gap (2+)</SelectItem>
              <SelectItem value="gap-medium">Medium Skill Gap (1)</SelectItem>
              <SelectItem value="gap-none">No Skill Gap (0)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            // Find the user's current skill level if it exists
            const userSkill = userSkills?.find((us: UserSkill) => us.skillId === skill.skillId);
            const currentLevel = userSkill ? userSkill.currentLevel : 0;
            const targetLevel = userSkill ? userSkill.targetLevel : 0;
            const skillGap = targetLevel - currentLevel;
            
            return (
              <Card 
                key={skill.skillId} 
                className={`
                  cursor-pointer hover:border-primary/50 transition-all
                  ${skillGap > 1 ? 'border-amber-200' : skillGap === 1 ? 'border-blue-100' : ''}
                `}
                onClick={() => setSelectedSkillId(skill.skillId)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      {getCategoryIcon(skill.category)}
                      <CardTitle className="ml-2 text-lg">{skill.skillName}</CardTitle>
                    </div>
                    {skillGap > 0 && (
                      <Badge variant={skillGap > 1 ? "destructive" : "outline"}>
                        Gap: {skillGap}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{skill.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {userSkill ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current: Level {currentLevel}</span>
                        <span>Target: Level {targetLevel}</span>
                      </div>
                      <Progress 
                        value={(currentLevel / 5) * 100} 
                        className="h-2" 
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Last assessed: {userSkill.lastAssessed ? new Date(userSkill.lastAssessed).toLocaleDateString() : 'Never'}</span>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          <span>{skill.questions.length} questions</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-sm text-muted-foreground">Not yet in your skill inventory</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full">
                    Take Assessment
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!selectedSkillId && renderSkillSelection()}

      {selectedSkillId && currentAssessment && !assessmentComplete && (
        <Card>
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  {getCategoryIcon(currentAssessment.category)}
                  <span className="ml-2">{currentAssessment.skillName} Assessment</span>
                </CardTitle>
                <CardDescription>{currentAssessment.description}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedSkillId(null)}>
                Choose Another Skill
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {renderQuestion()}
          </CardContent>
        </Card>
      )}

      {selectedSkillId && currentAssessment && assessmentComplete && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{currentAssessment.skillName} Assessment Results</CardTitle>
            <CardDescription>
              Review your performance and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderResults()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SkillAssessment;