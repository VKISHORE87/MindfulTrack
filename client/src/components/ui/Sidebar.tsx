import { Link } from "wouter";
import { User } from "@shared/schema";
import {
  Home,
  BookOpen,
  TrendingUp,
  CheckCircle,
  LightbulbIcon,
  Briefcase,
  Brain,
  Target,
  Lock,
  CheckCircle2
} from "lucide-react";
import { useTargetRole } from "@/contexts/TargetRoleContext";
import { useUserJourney } from "@/contexts/UserJourneyContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  user: Omit<User, 'password'>;
  currentRoute: string;
}

export default function Sidebar({ user, currentRoute }: SidebarProps) {
  const { targetRole } = useTargetRole();
  const { steps, currentStep, setCurrentStep, isStepAccessible } = useUserJourney();

  const getIconForStep = (stepId: string) => {
    const iconMap = {
      'dashboard': <Home className="h-5 w-5 mr-3" />,
      'profile': <Target className="h-5 w-5 mr-3" />,
      'assessment': <Brain className="h-5 w-5 mr-3" />,
      'goals': <Briefcase className="h-5 w-5 mr-3" />,
      'gap-analysis': <TrendingUp className="h-5 w-5 mr-3" />,
      'learning': <BookOpen className="h-5 w-5 mr-3" />,
      'progress': <TrendingUp className="h-5 w-5 mr-3" />,
      'validation': <CheckCircle className="h-5 w-5 mr-3" />
    };
    return iconMap[stepId] || <Home className="h-5 w-5 mr-3" />;
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-primary text-white p-2 rounded-lg">
            <LightbulbIcon className="h-6 w-6" />
          </div>
          <h1 className="ml-2 text-xl font-bold">Upcraft</h1>
        </div>
      </div>
      
      {/* Target Role Indicator */}
      {targetRole && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs text-gray-500">Target Role:</p>
                    <Badge variant="outline" className="font-medium text-primary">
                      {targetRole.title}
                    </Badge>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 max-w-xs">
                  <p className="font-semibold">{targetRole.title}</p>
                  <p className="text-xs">Required skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {targetRole.requiredSkills && targetRole.requiredSkills.length > 0 ? (
                      targetRole.requiredSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No skills specified</span>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div 
              className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
                currentRoute === item.href || 
                (item.href === '/dashboard' && currentRoute === '/') 
                  ? 'text-gray-900 bg-gray-100' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </div>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Link href="/profile">
          <div className="flex items-center cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role || 'User'}</p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
