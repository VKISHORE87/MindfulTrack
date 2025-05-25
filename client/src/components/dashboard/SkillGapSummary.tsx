import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { AlertTriangle, ChevronRight, TrendingUp, PieChart } from "lucide-react";
import { Link } from "wouter";
import { useCareerGoal } from "@/contexts/CareerGoalContext";
import { useTargetRole } from '@/contexts/TargetRoleContext';
import { useState, useEffect } from "react";

interface Skill {
  name: string;
  status?: 'missing' | 'improvement' | 'strong' | string;
  percentage?: number;
  priority?: number;
  [key: string]: any; // Allow additional properties
}

interface SkillGapSummaryProps {
  skills?: Skill[];
  maxDisplayed?: number;
}

export default function SkillGapSummary({ 
  skills = [], 
  maxDisplayed = 5 
}: SkillGapSummaryProps) {
  const { targetRoleSkills, currentGoal } = useCareerGoal();
  const { targetRole } = useTargetRole();
  const [displaySkills, setDisplaySkills] = useState<Skill[]>([]);
  
  // Fetch actual user skills data
  const fetchUserSkills = async () => {
    try {
      const response = await fetch('/api/users/skills');
      if (response.ok) {
        const userSkills = await response.json();
        return userSkills;
      }
      return [];
    } catch (error) {
      console.error("Error fetching user skills:", error);
      return [];
    }
  };

  // Update skills when targetRole, targetRoleSkills or provided skills change
  useEffect(() => {
    const updateSkillsData = async () => {
      // If skills were provided as props, use them
      if (skills.length > 0) {
        setDisplaySkills(skills);
        return;
      }
      
      // Get user's actual skills
      const userSkills = await fetchUserSkills();
      const userSkillsMap = new Map(
        userSkills.map((skill: any) => [skill.skillName.toLowerCase(), skill])
      );
      
      // Use targetRole's requiredSkills if available (higher priority)
      if (targetRole && targetRole.requiredSkills && targetRole.requiredSkills.length > 0) {
        const skillsWithGaps = targetRole.requiredSkills.map(skillName => {
          const userSkill = userSkillsMap.get(skillName.toLowerCase());
          
          // If user has this skill, use actual data
          if (userSkill) {
            const percentage = Math.round((userSkill.currentLevel / userSkill.targetLevel) * 100);
            return {
              name: skillName,
              status: percentage < 50 ? 'improvement' : 'strong',
              percentage: percentage,
              hasSkill: true
            };
          }
          
          // If user doesn't have this skill, mark as missing
          return {
            name: skillName,
            status: 'missing',
            percentage: 0,
            hasSkill: false
          };
        });
        
        setDisplaySkills(skillsWithGaps);
      }
      // Otherwise, use targetRoleSkills from CareerGoalContext as fallback
      else if (targetRoleSkills.length > 0) {
        const skillsWithGaps = targetRoleSkills.map(skillName => {
          const userSkill = userSkillsMap.get(skillName.toLowerCase());
          
          // If user has this skill, use actual data
          if (userSkill) {
            const percentage = Math.round((userSkill.currentLevel / userSkill.targetLevel) * 100);
            return {
              name: skillName,
              status: percentage < 50 ? 'improvement' : 'strong',
              percentage: percentage,
              hasSkill: true
            };
          }
          
          // If user doesn't have this skill, mark as missing
          return {
            name: skillName,
            status: 'missing',
            percentage: 0,
            hasSkill: false
          };
        });
        
        setDisplaySkills(skillsWithGaps);
      } else {
        // No target role skills available - show empty state
        setDisplaySkills([]);
      }
    };
    
    updateSkillsData();
  }, [targetRole, targetRoleSkills, skills, currentGoal?.id]);
  
  // Sort skills by priority (missing first, then improvement)
  const sortedSkills = [...displaySkills].sort((a, b) => {
    if (a.status === 'missing' && b.status !== 'missing') return -1;
    if (a.status !== 'missing' && b.status === 'missing') return 1;
    if (a.status === 'improvement' && b.status === 'strong') return -1;
    if (a.status === 'strong' && b.status === 'improvement') return 1;
    return (a.percentage || 0) - (b.percentage || 0);
  });
  
  // Take only the top N skills
  const topSkills = sortedSkills.slice(0, maxDisplayed);
  
  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <PieChart className="h-5 w-5 text-primary mr-2" />
          <div>
            <h3 className="font-semibold text-lg">Priority Skill Gaps</h3>
            {targetRole && (
              <p className="text-sm text-muted-foreground">For {targetRole.title} role</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topSkills.length > 0 ? (
            topSkills.map((skill, index) => {
              // Determine styling based on skill status
              const IconComponent = skill.status === 'missing' 
                ? AlertTriangle 
                : TrendingUp;
              
              const bgColor = skill.status === 'missing' 
                ? 'bg-red-50' 
                : 'bg-amber-50';
              
              const borderColor = skill.status === 'missing' 
                ? 'border-red-100' 
                : 'border-amber-100';
              
              const textColor = skill.status === 'missing' 
                ? 'text-red-700' 
                : 'text-amber-700';
              
              const iconColor = skill.status === 'missing' 
                ? 'text-red-500' 
                : 'text-amber-500';
              
              return (
                <div key={index} className={`flex items-start p-3 rounded-lg border ${bgColor} ${borderColor}`}>
                  <IconComponent className={`h-5 w-5 ${iconColor} mr-3 flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className={`font-medium ${textColor}`}>{skill.name}</p>
                    <p className="text-sm text-gray-600">
                      {skill.status === 'missing' 
                        ? 'Not yet developed' 
                        : `Current level: ${skill.percentage || 30}%`}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Complete a skill assessment to see your skill gaps</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href="/assessment?tab=skill-gap" className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
          View detailed skill gap analysis
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}