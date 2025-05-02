import { Card } from "@/components/ui/card";
import { BarChart2, CheckCircle, Clock, BookOpen, ArrowRight, FileText, Video, PuzzleIcon, ChevronUp } from "lucide-react";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { Progress } from "@/components/ui/progress";
import { useCareerGoal } from "@/contexts/CareerGoalContext";

interface SkillCategory {
  name: string;
  progress: number;
}

interface ValidatedSkill {
  id: number;
  name: string;
  validationMethod: string;
  validationDate: string;
}

interface PendingSkill {
  id: number;
  name: string;
  priority: string;
}

interface LearningCategory {
  name: string;
  hours: number;
}

interface ResourceType {
  type: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface ResourceItem {
  id: number;
  title: string;
  type: string;
  progress: number;
  completionDate?: string;
}

interface StatCardProps {
  title: string;
  value: string;
  type: 'progress' | 'validated' | 'time' | 'resources';
  skillBreakdown?: SkillCategory[];
  validatedSkills?: ValidatedSkill[];
  pendingSkills?: PendingSkill[];
  timeBreakdown?: LearningCategory[];
  learningStreak?: { current: number; best: number };
  resourceTypes?: ResourceType[];
  completedResources?: ResourceItem[];
  inProgressResources?: ResourceItem[];
}

export default function StatCard({ 
  title, 
  value, 
  type,
  skillBreakdown = [
    { name: "Technical Skills", progress: 45 },
    { name: "Soft Skills", progress: 60 },
    { name: "Domain Knowledge", progress: 30 }
  ],
  validatedSkills = [
    { id: 1, name: "JavaScript", validationMethod: "Assessment", validationDate: "2 weeks ago" },
    { id: 2, name: "React", validationMethod: "Project", validationDate: "1 month ago" }
  ],
  pendingSkills = [
    { id: 1, name: "Python", priority: "High" },
    { id: 2, name: "System Design", priority: "Medium" },
    { id: 3, name: "Technical Documentation", priority: "Low" }
  ],
  timeBreakdown = [
    { name: "Technical Learning", hours: 12.5 },
    { name: "Soft Skills", hours: 5.2 },
    { name: "Projects", hours: 8.7 }
  ],
  learningStreak = { current: 3, best: 7 },
  resourceTypes = [
    { type: "Courses", count: 3, icon: BookOpen },
    { type: "Articles", count: 5, icon: FileText },
    { type: "Videos", count: 2, icon: Video },
    { type: "Projects", count: 1, icon: BookOpen }
  ],
  completedResources = [
    { id: 1, title: "Introduction to JavaScript", type: "Course", progress: 100, completionDate: "2 weeks ago" },
    { id: 2, title: "React Fundamentals", type: "Course", progress: 100, completionDate: "1 month ago" }
  ],
  inProgressResources = [
    { id: 3, title: "Advanced React Patterns", type: "Course", progress: 45 },
    { id: 4, title: "System Design for Frontend Engineers", type: "Course", progress: 20 }
  ]
}: StatCardProps) {
  const { currentGoal } = useCareerGoal();
  const targetRole = currentGoal?.title || '';
  
  const getIcon = () => {
    switch (type) {
      case 'progress':
        return (
          <div className="p-3 rounded-full bg-primary-100 text-primary mr-4">
            <BarChart2 className="h-6 w-6" />
          </div>
        );
      case 'validated':
        return (
          <div className="p-3 rounded-full bg-green-100 text-emerald-500 mr-4">
            <CheckCircle className="h-6 w-6" />
          </div>
        );
      case 'time':
        return (
          <div className="p-3 rounded-full bg-amber-100 text-amber-500 mr-4">
            <Clock className="h-6 w-6" />
          </div>
        );
      case 'resources':
        return (
          <div className="p-3 rounded-full bg-indigo-100 text-primary mr-4">
            <BookOpen className="h-6 w-6" />
          </div>
        );
      default:
        return null;
    }
  };

  const getTooltipContent = () => {
    switch (type) {
      case 'progress':
        return (
          <>
            <h4 className="font-medium mb-2">Progress Breakdown</h4>
            
            {/* Progress breakdown by category */}
            <div className="mb-3">
              {skillBreakdown.map((category, idx) => (
                <div key={idx} className="flex justify-between items-center mb-1">
                  <span className="text-sm">{category.name}</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${category.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs">{category.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Recent achievements */}
            <h4 className="font-medium mb-1">For Target Role: {targetRole}</h4>
            <ul className="text-xs mb-3">
              <li className="mb-1 flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5" />
                <span>Technical skills are on track</span>
              </li>
              <li className="mb-1 flex items-start">
                <ArrowRight className="h-3 w-3 text-amber-500 mr-1 mt-0.5" />
                <span>Focus on improving System Design skills</span>
              </li>
            </ul>
            
            {/* Next milestones */}
            <h4 className="font-medium mb-1">Next Milestones</h4>
            <div className="text-xs text-gray-600">
              Complete "System Design" to gain +8% progress toward {targetRole}
            </div>
          </>
        );
      case 'validated':
        return (
          <>
            <h4 className="font-medium mb-2">Validated Skills</h4>
            
            {/* List of validated skills */}
            <div className="mb-3 max-h-40 overflow-y-auto">
              {validatedSkills.map(skill => (
                <div key={skill.id} className="flex justify-between items-center mb-1 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span>{skill.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span>{skill.validationMethod}</span>
                    <span className="mx-1">•</span>
                    <span>{skill.validationDate}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Next skills to validate */}
            <h4 className="font-medium mb-1">Priority Skills to Validate</h4>
            <ul className="text-xs mb-3">
              {pendingSkills.slice(0, 3).map(skill => (
                <li key={skill.id} className="mb-1 flex items-start">
                  <ArrowRight className="h-3 w-3 text-orange-500 mr-1 mt-0.5" />
                  <span>{skill.name}</span>
                  <span className="ml-auto text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                    {skill.priority}
                  </span>
                </li>
              ))}
            </ul>
            
            <div className="text-xs text-center">
              <a href="/assessment" className="text-primary hover:text-primary-800">
                Take skill assessment
              </a>
            </div>
          </>
        );
      case 'time':
        return (
          <>
            <h4 className="font-medium mb-2">Learning Time Breakdown</h4>
            
            {/* Time breakdown chart */}
            <div className="mb-3">
              {timeBreakdown.map((category, idx) => (
                <div key={idx} className="flex justify-between items-center mb-1">
                  <span className="text-sm">{category.name}</span>
                  <div className="flex items-center">
                    <span className="text-xs mr-2">{category.hours} hrs</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-amber-500 rounded-full" 
                        style={{ width: `${(category.hours / timeBreakdown.reduce((total, cat) => total + cat.hours, 0)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Weekly trend */}
            <div className="mb-3">
              <h4 className="font-medium mb-1 text-sm">Weekly Trend</h4>
              <div className="flex items-end h-12 space-x-1">
                {[3, 5, 2, 7, 4, 6, 3].map((hours, idx) => (
                  <div 
                    key={idx}
                    className="bg-primary/20 rounded-t w-6"
                    style={{ height: `${(hours/7)*100}%` }}
                  >
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
            
            {/* Learning streak */}
            <div className="text-xs flex justify-between mb-3">
              <div>
                <span className="font-medium">Current streak:</span> {learningStreak.current} days
              </div>
              <div>
                <span className="font-medium">Best streak:</span> {learningStreak.best} days
              </div>
            </div>
            
            {/* Learning efficiency */}
            <h4 className="font-medium mb-1 text-sm">Learning Efficiency</h4>
            <div className="flex items-center mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <span className="text-xs">65%</span>
            </div>
            
            <div className="text-xs text-gray-600">
              Tip: Short, daily learning sessions are more effective than occasional long sessions.
            </div>
          </>
        );
      case 'resources':
        return (
          <>
            <h4 className="font-medium mb-2">Resource Breakdown</h4>
            
            {/* Resource type breakdown */}
            <div className="mb-3 flex justify-between text-xs">
              {resourceTypes.map((resource, idx) => {
                const Icon = resource.icon;
                return (
                  <div key={idx} className="text-center">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>{resource.type}</div>
                    <div className="font-medium">{resource.count}</div>
                  </div>
                );
              })}
            </div>

            {/* In Progress Resources */}
            <h4 className="font-medium mb-1">Resources In Progress</h4>
            <div className="mb-3 max-h-24 overflow-y-auto">
              {inProgressResources.map(resource => (
                <div key={resource.id} className="mb-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium">{resource.title}</span>
                    <span>{resource.progress}%</span>
                  </div>
                  <Progress value={resource.progress} className="h-1.5 my-1" />
                </div>
              ))}
            </div>
            
            {/* Recently Completed */}
            <h4 className="font-medium mb-1">Recently Completed</h4>
            <div className="text-xs">
              {completedResources.slice(0, 2).map(resource => (
                <div key={resource.id} className="flex items-center mb-1">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  <span>{resource.title}</span>
                  <span className="ml-auto text-gray-500">{resource.completionDate}</span>
                </div>
              ))}
            </div>
            
            <div className="text-xs text-center mt-3">
              <a href="/resources" className="text-primary hover:text-primary-800">
                View all resources
              </a>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 flex items-center relative group hover:shadow-md transition-shadow">
      {getIcon()}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
      
      {/* Hover tooltip */}
      <HoverTooltip>
        {getTooltipContent()}
      </HoverTooltip>
      
      {/* Hover indicator */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
        <ChevronUp className="h-3 w-3" />
      </div>
    </Card>
  );
}
