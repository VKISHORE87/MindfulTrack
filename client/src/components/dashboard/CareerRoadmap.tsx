import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCareerGoal } from "@/contexts/CareerGoalContext";
import { useTargetRole } from '@/contexts/TargetRoleContext';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

// Define milestone type
interface Task {
  title: string;
  completed: boolean;
}

interface Milestone {
  title: string;
  timeframe: string;
  tasks: Task[];
  current: boolean;
}

export default function CareerRoadmap() {
  const { currentGoal, targetRoleSkills } = useCareerGoal();
  const { targetRole } = useTargetRole();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the target role name from targetRole context or fall back to current goal
  const targetRoleName = targetRole?.title || currentGoal?.title || 'Not set';
  
  // Generate milestones based on actual target role skills
  useEffect(() => {
    setIsLoading(true);
    
    const generateMilestones = () => {
      // Get skills from target role or fallback to context skills
      const skills = targetRole?.requiredSkills || targetRoleSkills || [];
      
      if (skills.length === 0) {
        // If no skills available, use basic structure
        return [
          {
            title: "Initial Assessment",
            timeframe: "Month 1",
            tasks: [
              { title: "Complete skill assessment", completed: true },
              { title: "Set career goals", completed: true }
            ],
            current: true
          }
        ];
      }
      
      // Group skills into learning phases
      const skillsPerPhase = Math.ceil(skills.length / 3);
      const phases = [
        {
          title: "Foundation Skills",
          timeframe: "Months 1-4",
          skills: skills.slice(0, skillsPerPhase),
          current: true
        },
        {
          title: "Advanced Skills",
          timeframe: "Months 5-8", 
          skills: skills.slice(skillsPerPhase, skillsPerPhase * 2),
          current: false
        },
        {
          title: "Mastery & Application",
          timeframe: "Months 9-12",
          skills: skills.slice(skillsPerPhase * 2),
          current: false
        }
      ];
      
      // Convert phases to milestones with skill-specific tasks
      return phases.map(phase => ({
        title: phase.title,
        timeframe: phase.timeframe,
        tasks: [
          ...phase.skills.map(skill => ({
            title: `Master ${skill}`,
            completed: false
          })),
          {
            title: `Complete ${phase.title.toLowerCase()} projects`,
            completed: false
          }
        ],
        current: phase.current
      }));
    };
    
    const generatedMilestones = generateMilestones();
    setMilestones(generatedMilestones);
    setIsLoading(false);
  }, [targetRole, targetRoleSkills, currentGoal]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Career Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Career Roadmap</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Path to {targetRoleName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Timeline</p>
            <p className="text-sm font-medium">{currentGoal?.timelineMonths || 12} months</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={index} className="relative">
              {/* Timeline connector */}
              {index < milestones.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200"></div>
              )}
              
              <div className="flex items-start space-x-3">
                {/* Milestone indicator */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  milestone.current 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {milestone.current ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </div>
                
                {/* Milestone content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${
                      milestone.current ? 'text-primary' : 'text-gray-700'
                    }`}>
                      {milestone.title}
                    </h4>
                    <Badge variant={milestone.current ? 'default' : 'secondary'} className="text-xs">
                      {milestone.timeframe}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    {milestone.tasks.slice(0, 3).map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-center text-sm text-gray-600">
                        <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${
                          task.completed ? 'bg-green-400' : 'bg-gray-200'
                        }`}></div>
                        <span className={task.completed ? 'line-through' : ''}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {milestone.tasks.length > 3 && (
                      <div className="text-xs text-gray-400 ml-5">
                        +{milestone.tasks.length - 3} more tasks
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Progress towards {targetRoleName}
            </span>
            <span className="font-medium">
              {Math.round((milestones.filter(m => m.current).length / milestones.length) * 100)}% planned
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}