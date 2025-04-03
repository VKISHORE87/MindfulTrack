import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define types for the practice questions
interface Option {
  id: string;
  text: string;
}

interface Question {
  id: number;
  question: string;
  options: Option[];
  correctAnswer: string;
  explanation: string;
  skillId: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface PracticeQuestionsProps {
  questions: Question[];
  skillId: number;
  userId: number;
  onComplete: (score: number, totalQuestions: number) => void;
}

export default function PracticeQuestions({ 
  questions, 
  skillId, 
  userId, 
  onComplete 
}: PracticeQuestionsProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected: string, correct: boolean }>>({});

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const checkAnswer = () => {
    if (!selectedOption) return;
    
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    setAnsweredCorrectly(isCorrect);
    setIsAnswered(true);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Store the answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selected: selectedOption,
        correct: isCorrect
      }
    }));
  };
  
  const nextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed
      onComplete(score, questions.length);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span className="text-sm font-medium">Score: {score}/{currentQuestionIndex}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-start gap-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              currentQuestion.difficulty === "beginner" ? "bg-green-100 text-green-700" :
              currentQuestion.difficulty === "intermediate" ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            }`}>
              {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
            </div>
            <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <RadioGroup 
            value={selectedOption || ""} 
            onValueChange={value => !isAnswered && setSelectedOption(value)}
            className="space-y-4"
            disabled={isAnswered}
          >
            {currentQuestion.options.map(option => (
              <div 
                key={option.id} 
                className={`flex items-center space-x-2 p-3 rounded-lg border ${
                  isAnswered ? (
                    option.id === currentQuestion.correctAnswer ? "border-green-500 bg-green-50" :
                    option.id === selectedOption ? "border-red-500 bg-red-50" :
                    "border-gray-200"
                  ) : (
                    option.id === selectedOption ? "border-primary bg-primary/5" : "border-gray-200"
                  )
                }`}
              >
                <RadioGroupItem 
                  value={option.id} 
                  id={option.id} 
                  className="focus:ring-0"
                  disabled={isAnswered}
                />
                <Label 
                  htmlFor={option.id} 
                  className={`flex-1 cursor-pointer ${
                    isAnswered && option.id === currentQuestion.correctAnswer ? "font-medium" : ""
                  }`}
                >
                  {option.text}
                </Label>
                {isAnswered && option.id === currentQuestion.correctAnswer && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {isAnswered && option.id === selectedOption && option.id !== currentQuestion.correctAnswer && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </RadioGroup>
          
          {isAnswered && (
            <div className={`mt-6 p-4 rounded-lg ${
              answeredCorrectly ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-100"
            }`}>
              <div className="flex items-start gap-3">
                {answeredCorrectly ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                )}
                <div>
                  <h4 className="font-medium">
                    {answeredCorrectly ? "Correct!" : "Not quite right"}
                  </h4>
                  <p className="text-sm mt-1">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t py-4">
          <div className="text-sm text-gray-500">
            Take your time to think through each question
          </div>
          
          {isAnswered ? (
            <Button onClick={nextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          ) : (
            <Button 
              onClick={checkAnswer} 
              disabled={!selectedOption}
              className="bg-primary hover:bg-primary-700"
            >
              Check Answer
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
