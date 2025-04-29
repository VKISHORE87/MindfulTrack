import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, CheckSquare, Target, Briefcase } from "lucide-react";

interface SkillPracticeCardProps {
  id: number;
  name: string;
  description: string;
  category: string;
  questionCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  onPractice: (skillId: number) => void;
  targetRole?: string; // New prop for target role
}

export default function SkillPracticeCard({
  id,
  name,
  description,
  category,
  questionCount,
  difficulty,
  onPractice,
  targetRole
}: SkillPracticeCardProps) {
  const isTargetRoleSkill = !!targetRole;
  
  return (
    <Card className={`overflow-hidden h-full flex flex-col ${isTargetRoleSkill ? 'border-primary/30 shadow-sm' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between mb-2">
          <Badge
            variant="outline"
            className={`capitalize ${
              category === "technical" ? "bg-blue-100 text-blue-800" :
              category === "leadership" ? "bg-purple-100 text-purple-800" :
              category === "communication" ? "bg-green-100 text-green-800" :
              category === "analytical" ? "bg-amber-100 text-amber-800" :
              "bg-gray-100 text-gray-800"
            }`}
          >
            {category}
          </Badge>
          <Badge 
            variant="outline"
            className={`
              ${difficulty === "beginner" ? "bg-green-100 text-green-800" : ""}
              ${difficulty === "intermediate" ? "bg-amber-100 text-amber-800" : ""}
              ${difficulty === "advanced" ? "bg-red-100 text-red-800" : ""}
            `}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold">{name}</h3>
        
        {/* Display target role badge if it exists */}
        {isTargetRoleSkill && (
          <div className="mt-1">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 gap-1 font-normal">
              <Briefcase className="h-3 w-3" />
              {targetRole}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pb-4 flex-grow">
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        
        <div className="flex flex-col space-y-3">
          <div className="flex items-center">
            <CheckSquare className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm">{questionCount} practice questions</span>
          </div>
          
          {isTargetRoleSkill ? (
            <div className="flex items-center">
              <Target className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm">Role-specific content</span>
            </div>
          ) : (
            <div className="flex items-center">
              <Target className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm">Tests key knowledge areas</span>
            </div>
          )}
          
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm">Includes detailed explanations</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 border-t">
        <Button
          className={`w-full ${isTargetRoleSkill ? 'bg-primary' : 'bg-secondary'} hover:bg-primary-700`}
          onClick={() => onPractice(id)}
        >
          Practice Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
