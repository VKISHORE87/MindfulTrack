import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SkillProgressBar from "@/components/ui/SkillProgressBar";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface SkillGap {
  id: number;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  percentage: number;
}

interface SkillGapAnalysisProps {
  skillGaps: SkillGap[];
}

export default function SkillGapAnalysis({ skillGaps }: SkillGapAnalysisProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <h3 className="text-lg font-bold">Skill Gap Analysis</h3>
        <p className="text-sm text-gray-500">Your current skill levels compared to target role requirements</p>
      </CardHeader>
      
      <CardContent>
        {skillGaps.map((skill) => (
          <SkillProgressBar
            key={skill.id}
            skillName={skill.name}
            percentage={skill.percentage}
          />
        ))}
        
        <div className="mt-6">
          <Link href="/assessment">
            <a className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-800">
              View full skill assessment
              <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
