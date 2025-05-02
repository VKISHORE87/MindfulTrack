import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCareerGoal } from "@/contexts/CareerGoalContext";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";

export default function CareerRoadmap() {
  const { currentGoal } = useCareerGoal();
  const targetRole = currentGoal?.title || 'Not set';
  
  // Sample milestones for the roadmap
  const milestones = [
    {
      title: "Foundation Building",
      timeframe: "Months 1-3",
      tasks: [
        { title: "Complete initial skill assessment", completed: true },
        { title: "Identify priority learning resources", completed: true },
        { title: "Finish core technical skills training", completed: false }
      ],
      current: false
    },
    {
      title: "Skill Development",
      timeframe: "Months 4-6",
      tasks: [
        { title: "Complete System Design fundamentals", completed: false },
        { title: "Build portfolio projects", completed: false },
        { title: "Obtain technical certifications", completed: false }
      ],
      current: true
    },
    {
      title: "Role-Specific Practice",
      timeframe: "Months 7-9",
      tasks: [
        { title: "Tackle real-world problems", completed: false },
        { title: "Participate in industry events", completed: false },
        { title: "Network with professionals", completed: false }
      ],
      current: false
    },
    {
      title: "Final Preparation",
      timeframe: "Months 10-12",
      tasks: [
        { title: "Mock interviews and assessments", completed: false },
        { title: "Resume and profile refinement", completed: false },
        { title: "Job application strategy", completed: false }
      ],
      current: false
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">
            Career Roadmap
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Target: {targetRole}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          Your 12-month journey to {targetRole}
        </div>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-2.5 top-0 h-full w-0.5 bg-gray-200 z-0"></div>
          
          {/* Milestones */}
          <div className="space-y-5">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="relative z-10">
                <div className="flex items-start">
                  {/* Status indicator */}
                  <div className={`rounded-full h-5 w-5 flex-shrink-0 mr-3 flex items-center justify-center ${
                    milestone.current ? 'bg-amber-500' : 
                    (idx < milestones.findIndex(m => m.current) ? 'bg-green-500' : 'bg-gray-200')
                  }`}>
                    {idx < milestones.findIndex(m => m.current) && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                    {milestone.current && (
                      <Clock className="h-3 w-3 text-white" />
                    )}
                  </div>
                  
                  {/* Milestone content */}
                  <div className={`bg-${milestone.current ? 'primary/5' : 'white'} p-3 rounded-lg border w-full ${
                    milestone.current ? 'border-primary/20' : 'border-gray-100'
                  }`}>
                    <div className="flex justify-between mb-1">
                      <h4 className="font-medium text-sm">{milestone.title}</h4>
                      <span className="text-xs text-gray-500">{milestone.timeframe}</span>
                    </div>
                    
                    <div className="space-y-1 mt-2">
                      {milestone.tasks.map((task, taskIdx) => (
                        <div key={taskIdx} className="flex items-center text-xs">
                          {task.completed ? (
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            milestone.current ? (
                              <ArrowRight className="h-3 w-3 text-amber-500 mr-1" />
                            ) : (
                              <div className="h-3 w-3 border border-gray-300 rounded-full mr-1"></div>
                            )
                          )}
                          <span className={task.completed ? 'text-gray-500 line-through' : ''}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}