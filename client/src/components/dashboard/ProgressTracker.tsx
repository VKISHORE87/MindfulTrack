import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, TrendingUp, Target, Award } from "lucide-react";
import { useCareerGoal } from "@/contexts/CareerGoalContext";

interface ProgressTrackerProps {
  progress: number;
  completedSkills: number;
  totalSkills: number;
  targetRole?: {
    title: string;
    timeframe?: string;
  };
}

export default function ProgressTracker({
  progress,
  completedSkills,
  totalSkills,
  targetRole
}: ProgressTrackerProps) {
  const { currentGoal, targetRoleSkills } = useCareerGoal();
  
  // Calculate stats based on context data if available
  const actualProgress = progress || (currentGoal ? Math.min(80, Math.max(30, completedSkills / Math.max(1, totalSkills) * 100)) : 0);
  const actualCompletedSkills = completedSkills || 0;
  const actualTotalSkills = totalSkills || (targetRoleSkills ? targetRoleSkills.length : 0);
  
  return (
    <Card className="border-primary/10 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Target className="h-5 w-5 text-primary mr-2" />
          <h3 className="font-semibold text-lg">Career Progress</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Readiness</span>
              <span className="text-sm font-medium">{Math.round(actualProgress)}%</span>
            </div>
            <Progress value={actualProgress} className="h-2.5" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Expert</span>
            </div>
          </div>
          
          {/* Target Role */}
          {(targetRole?.title || currentGoal?.title) && (
            <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
              <Award className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Target Role: {targetRole?.title || currentGoal?.title}</div>
                <div className="text-xs text-gray-600">
                  Estimated timeline: {targetRole?.timeframe || currentGoal?.timelineMonths ? `${currentGoal.timelineMonths} months` : '6-12 months'}
                </div>
              </div>
            </div>
          )}
          
          {/* Skills Count */}
          <div className="flex items-center p-3 bg-emerald-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
            <div>
              <div className="font-medium text-sm">Skills Acquired</div>
              <div className="text-xs text-gray-600">
                {actualCompletedSkills} of {actualTotalSkills} skills
              </div>
            </div>
          </div>
          
          {/* Progress Statement */}
          <div className="text-sm text-gray-600 italic">
            {actualProgress < 40 ? (
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-amber-500 mr-2" />
                You're making progress, but key skills need development.
              </div>
            ) : actualProgress < 70 ? (
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                You're on track with your skill development plan.
              </div>
            ) : (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                You're well-prepared for your target role!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}