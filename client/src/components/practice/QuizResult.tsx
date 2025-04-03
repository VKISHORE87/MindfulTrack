import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, BarChart2, ArrowRight } from "lucide-react";

interface QuizResultProps {
  score: number;
  totalQuestions: number;
  skillName: string;
  onRetry: () => void;
  onFinish: () => void;
}

export default function QuizResult({ 
  score, 
  totalQuestions, 
  skillName, 
  onRetry, 
  onFinish 
}: QuizResultProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const isPassing = percentage >= 70;
  
  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className={`${isPassing ? "bg-green-50" : "bg-amber-50"} text-center border-b`}>
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${isPassing ? "bg-green-100" : "bg-amber-100"}`}>
            {isPassing ? (
              <Award className="h-8 w-8 text-green-600" />
            ) : (
              <BarChart2 className="h-8 w-8 text-amber-600" />
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold">{isPassing ? "Congratulations!" : "Nice Try!"}</h2>
        <p className="text-gray-600">
          {isPassing 
            ? "You've demonstrated a good understanding of this skill." 
            : "You're on your way to mastering this skill. Keep practicing!"}
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            {score} / {totalQuestions}
          </div>
          <p className="text-gray-500">
            You scored {percentage}% on {skillName}
          </p>
        </div>
        
        <div className="p-4 rounded-lg bg-gray-50 text-center">
          <h3 className="font-medium mb-2">What's Next?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            {isPassing ? (
              <>
                <li>• Try more advanced practice questions</li>
                <li>• Apply this knowledge in practical exercises</li>
                <li>• Validate your skill with a certification</li>
              </>
            ) : (
              <>
                <li>• Review the learning resources for this skill</li>
                <li>• Try again after studying the material</li>
                <li>• Focus on the questions you missed</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-4 border-t p-6">
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
        <Button className="bg-primary hover:bg-primary-700" onClick={onFinish}>
          <span>Back to Skill Development</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
