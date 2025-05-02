import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight, 
  LightbulbIcon,
  Brain 
} from "lucide-react";
import { Link } from "wouter";
import { useCareerGoal } from "@/contexts/CareerGoalContext";

interface NextStepAction {
  title: string;
  description: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  priority?: 'high' | 'medium' | 'low';
}

interface NextStepsPanelProps {
  actions?: NextStepAction[];
  showAIPlaceholder?: boolean;
}

export default function NextStepsPanel({ 
  actions = [],
  showAIPlaceholder = true
}: NextStepsPanelProps) {
  const { currentGoal, targetRoleSkills } = useCareerGoal();
  
  // If no actions are provided, generate default next steps
  // based on the context data
  const defaultActions: NextStepAction[] = [];
  
  // Skill Assessment recommendation if we have a target role with skills
  if (targetRoleSkills && targetRoleSkills.length > 0) {
    defaultActions.push({
      title: "Take Skill Assessment",
      description: "Evaluate your skill levels for your target role",
      href: "/assessment",
      icon: Brain,
      priority: "high"
    });
  }
  
  // Learning Resources recommendation if we have a current goal
  if (currentGoal) {
    defaultActions.push({
      title: "Start Learning Path",
      description: `Begin your journey to ${currentGoal.title}`,
      href: "/resources",
      icon: BookOpen,
      priority: "high"
    });
  } else {
    // If no goal is set, recommend setting one
    defaultActions.push({
      title: "Set Career Goal",
      description: "Define your target role to get personalized recommendations",
      href: "/career-transitions",
      icon: ArrowRight,
      priority: "high"
    });
  }
  
  // Display the provided actions or the default ones
  const displayActions = actions.length > 0 ? actions : defaultActions;
  
  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
          <h3 className="font-semibold text-lg">Recommended Next Steps</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActions.map((action, index) => {
            const Icon = action.icon || ArrowRight;
            
            return (
              <div key={index} className="group">
                <Link href={action.href}>
                  <div className="flex items-start p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 cursor-pointer transition-colors">
                    <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-primary transition-colors">
                        {action.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 ml-auto self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </div>
            );
          })}
          
          {/* AI Coach Placeholder */}
          {showAIPlaceholder && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-primary/10">
              <div className="flex items-start">
                <div className="bg-primary/20 p-2 rounded-full mr-3 flex-shrink-0">
                  <LightbulbIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    AI Coach Suggestion
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Ready to provide personalized guidance for your career journey
                  </p>
                  <Button variant="outline" size="sm" className="text-sm">
                    <Link href="/dashboard?aiCoach=true">
                      Talk to AI Coach
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href="/resources" className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
          View all learning resources
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}