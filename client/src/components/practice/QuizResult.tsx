import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, RotateCcw, CheckCircle, HomeIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuizResultProps {
  score: number;
  totalQuestions: number;
  skillName: string;
  onRetry: () => void;
  onFinish: () => void;
}

export default function QuizResult({ score, totalQuestions, skillName, onRetry, onFinish }: QuizResultProps) {
  const percentage = (score / totalQuestions) * 100;
  
  // Determine quiz result type based on score percentage
  const resultType = 
    percentage >= 90 ? "excellent" :
    percentage >= 70 ? "good" :
    percentage >= 50 ? "average" :
    "needsImprovement";
  
  // Get feedback based on result type
  const resultData = {
    excellent: {
      title: "Excellent Work!",
      message: `You have a strong mastery of ${skillName}. Keep up the great work!`,
      className: "bg-green-50 border-green-100",
      progressClass: "bg-green-500",
      icon: <Award className="h-12 w-12 text-green-500" />
    },
    good: {
      title: "Good Job!",
      message: `You have a solid understanding of ${skillName}. A bit more practice will make you an expert.`,
      className: "bg-blue-50 border-blue-100",
      progressClass: "bg-blue-500",
      icon: <CheckCircle className="h-12 w-12 text-blue-500" />
    },
    average: {
      title: "You're Making Progress",
      message: `You have a basic understanding of ${skillName}. Continue practicing to improve your skills.`,
      className: "bg-amber-50 border-amber-100",
      progressClass: "bg-amber-500",
      icon: <CheckCircle className="h-12 w-12 text-amber-500" />
    },
    needsImprovement: {
      title: "Keep Practicing",
      message: `${skillName} might be challenging, but don't give up! Review the material and try again.`,
      className: "bg-rose-50 border-rose-100",
      progressClass: "bg-rose-500", 
      icon: <RotateCcw className="h-12 w-12 text-rose-500" />
    }
  };
  
  const result = resultData[resultType];
  
  return (
    <Card className={`overflow-hidden border ${result.className}`}>
      <CardHeader className="flex flex-col items-center text-center pb-2">
        {result.icon}
        <h3 className="text-2xl font-bold mt-4">{result.title}</h3>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="text-4xl font-bold">
          {score} <span className="text-gray-500 text-lg">/ {totalQuestions}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Your score</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <Progress value={percentage} className={`h-3 ${result.progressClass}`} />
        </div>
        
        <p className="text-gray-600">{result.message}</p>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        
        <Button onClick={onFinish}>
          <HomeIcon className="h-4 w-4 mr-2" />
          Back to Skills
        </Button>
      </CardFooter>
    </Card>
  );
}