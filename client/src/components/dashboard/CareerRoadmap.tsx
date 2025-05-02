import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Route, CheckCircle, Circle, ArrowRight } from "lucide-react";
import { useCareerGoal } from "@/contexts/CareerGoalContext";

interface RoadmapMilestone {
  title: string;
  description: string;
  skills: string[];
  completed: boolean;
  timeframe: string;
}

interface CareerRoadmapProps {
  milestones?: RoadmapMilestone[];
}

export default function CareerRoadmap({ milestones = [] }: CareerRoadmapProps) {
  const { currentGoal, targetRoleSkills } = useCareerGoal();
  
  // Generate default milestones if none provided
  const defaultMilestones: RoadmapMilestone[] = [
    {
      title: "Foundation Skills",
      description: "Build core competencies required for the role",
      skills: targetRoleSkills.slice(0, 2),
      completed: true,
      timeframe: "1-2 months"
    },
    {
      title: "Intermediate Knowledge",
      description: "Develop specialized knowledge and experience",
      skills: targetRoleSkills.slice(2, 4),
      completed: false,
      timeframe: "3-4 months"
    },
    {
      title: "Advanced Expertise",
      description: "Master complex concepts and gain practical experience",
      skills: targetRoleSkills.slice(0, 3),
      completed: false,
      timeframe: "5-8 months"
    },
    {
      title: currentGoal?.title || "Target Role",
      description: "Transition to target role and continue professional development",
      skills: [],
      completed: false,
      timeframe: "9-12 months"
    }
  ];
  
  // Use provided milestones or defaults
  const displayMilestones = milestones.length > 0 ? milestones : defaultMilestones;

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Route className="h-5 w-5 text-primary mr-2" />
          <h3 className="font-semibold text-lg">Career Roadmap</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-3.5 top-1 h-full w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {displayMilestones.map((milestone, index) => (
              <div key={index} className="relative pl-10 pb-2">
                {/* Milestone status indicator */}
                <div className="absolute left-0 top-1">
                  {milestone.completed ? (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                      <Circle className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Milestone content */}
                <div className={`transition ${milestone.completed ? 'opacity-100' : 'opacity-80'}`}>
                  <div className="flex items-center mb-1">
                    <h4 className={`font-medium ${index === displayMilestones.length - 1 ? 'text-primary' : ''}`}>
                      {milestone.title}
                    </h4>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full ml-2">
                      {milestone.timeframe}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1.5">
                    {milestone.description}
                  </p>
                  
                  {/* Skills for this milestone */}
                  {milestone.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {milestone.skills.map((skill, skillIndex) => (
                        <span 
                          key={skillIndex}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Next step indicator for current milestone */}
                  {index < displayMilestones.length - 1 && !milestone.completed && index === displayMilestones.findIndex(m => !m.completed) && (
                    <div className="text-xs text-primary font-medium mt-1 flex items-center">
                      Current focus
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}