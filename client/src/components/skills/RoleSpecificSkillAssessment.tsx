import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCareerGoal } from "@/contexts/CareerGoalContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  BookOpen,
  Star,
  Clock,
  Award
} from "lucide-react";
import { useLocation } from "wouter";

interface RoleSkill {
  id: number;
  name: string;
  category: string;
  importance: 'critical' | 'important' | 'beneficial';
  requiredLevel: number;
  currentLevel: number | null;
  isAssessed: boolean;
  roleRelevance: string;
  gapLevel: number;
}

interface SkillCategory {
  title: string;
  description: string;
  skills: RoleSkill[];
  color: string;
}

export default function RoleSpecificSkillAssessment({ user }: { user: any }) {
  const { currentGoal } = useCareerGoal();
  const [location, setLocation] = useLocation();
  const [targetRole, setTargetRole] = useState<string>("");
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);

  // Fetch target role skills
  const { data: roleData } = useQuery({
    queryKey: ['/api/interview/roles'],
    queryFn: () => fetch('/api/interview/roles').then(res => res.json()),
  });

  // Fetch user's current skill assessments
  const { data: userSkills } = useQuery({
    queryKey: [`/api/users/${user.id}/skills`],
    queryFn: () => fetch(`/api/users/${user.id}/skills`).then(res => res.json()),
  });

  // Fetch all available skills
  const { data: availableSkills } = useQuery({
    queryKey: ['/api/skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json()),
  });

  // Process role-specific skills
  useEffect(() => {
    if (currentGoal?.targetRoleId && roleData && availableSkills && userSkills) {
      const targetRoleData = roleData.find((role: any) => role.id === currentGoal.targetRoleId);
      
      if (targetRoleData) {
        setTargetRole(targetRoleData.title);
        
        // Map required skills to detailed skill objects
        const roleSkills = targetRoleData.requiredSkills.map((skillName: string) => {
          const skillData = availableSkills.find((skill: any) => 
            skill.name.toLowerCase() === skillName.toLowerCase()
          );
          
          const userSkillData = userSkills.find((userSkill: any) => 
            userSkill.skillId === skillData?.id
          );

          // Determine importance based on skill type and role requirements
          let importance: 'critical' | 'important' | 'beneficial' = 'important';
          const criticalSkills = ['Programming', 'System Design', 'Problem Solving'];
          const beneficialSkills = ['Communication', 'Project Management'];
          
          if (criticalSkills.some(critical => skillName.toLowerCase().includes(critical.toLowerCase()))) {
            importance = 'critical';
          } else if (beneficialSkills.some(beneficial => skillName.toLowerCase().includes(beneficial.toLowerCase()))) {
            importance = 'beneficial';
          }

          const requiredLevel = importance === 'critical' ? 90 : importance === 'important' ? 75 : 60;
          const currentLevel = userSkillData?.currentLevel || null;
          const gapLevel = currentLevel ? Math.max(0, requiredLevel - currentLevel) : requiredLevel;

          return {
            id: skillData?.id || 0,
            name: skillName,
            category: skillData?.category || 'technical',
            importance,
            requiredLevel,
            currentLevel,
            isAssessed: !!userSkillData,
            roleRelevance: getRoleRelevance(skillName, targetRoleData.title),
            gapLevel
          };
        }).filter((skill: RoleSkill) => skill.id > 0);

        // Categorize skills by importance
        const categories: SkillCategory[] = [
          {
            title: "Critical Skills",
            description: "Essential skills required for this role",
            skills: roleSkills.filter((skill: RoleSkill) => skill.importance === 'critical'),
            color: "bg-red-50 border-red-200"
          },
          {
            title: "Important Skills",
            description: "Skills that significantly impact your effectiveness",
            skills: roleSkills.filter((skill: RoleSkill) => skill.importance === 'important'),
            color: "bg-yellow-50 border-yellow-200"
          },
          {
            title: "Beneficial Skills",
            description: "Skills that provide additional value",
            skills: roleSkills.filter((skill: RoleSkill) => skill.importance === 'beneficial'),
            color: "bg-green-50 border-green-200"
          }
        ];

        setSkillCategories(categories);
      }
    }
  }, [currentGoal, roleData, availableSkills, userSkills]);

  const getRoleRelevance = (skillName: string, roleName: string): string => {
    const relevanceMap: Record<string, string> = {
      'Programming': `Core requirement for ${roleName} - used daily for building and maintaining systems`,
      'System Design': `Essential for ${roleName} - needed to architect scalable solutions`,
      'Problem Solving': `Critical thinking skill for ${roleName} - helps debug issues and optimize processes`,
      'Technical Documentation': `Important for ${roleName} - ensures knowledge sharing and maintainability`,
      'Project Management': `Valuable for ${roleName} - helps coordinate tasks and meet deadlines`,
      'Communication': `Key soft skill for ${roleName} - enables effective collaboration with team members`,
      'Continuous Integration': `DevOps core skill - automates testing and deployment pipelines`,
      'Containerization': `Modern infrastructure skill - enables consistent deployment environments`,
      'Infrastructure as Code': `DevOps essential - manages infrastructure through version-controlled code`,
      'Cloud Services': `Critical for modern ${roleName} - provides scalable and reliable infrastructure`,
      'Monitoring': `Essential for ${roleName} - ensures system health and performance optimization`
    };
    
    return relevanceMap[skillName] || `Important skill for ${roleName} role development`;
  };

  const calculateOverallProgress = (): number => {
    const allSkills = skillCategories.flatMap(category => category.skills);
    if (allSkills.length === 0) return 0;
    
    const assessedSkills = allSkills.filter(skill => skill.isAssessed);
    return Math.round((assessedSkills.length / allSkills.length) * 100);
  };

  const getImportanceBadgeColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'important': return 'bg-yellow-100 text-yellow-800';
      case 'beneficial': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startAssessment = (skill: RoleSkill) => {
    setLocation(`/assessment?skillId=${skill.id}&context=role&targetRole=${encodeURIComponent(targetRole)}`);
  };

  const roleSkillsList = skillCategories.flatMap(category => category.skills);
  const totalSkills = roleSkillsList.length;
  const assessedSkills = roleSkillsList.filter((skill: RoleSkill) => skill.isAssessed).length;
  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-8">
      {/* Header with Target Role Context */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Skill Assessment</h1>
        </div>
        
        {targetRole && (
          <div className="bg-white rounded-lg p-4 border mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-600">Target Role:</span>
              <Badge variant="outline" className="text-base font-semibold px-3 py-1">
                {targetRole}
              </Badge>
            </div>
            <p className="text-gray-700">
              Assess your current skill levels for the {targetRole} role to identify areas for improvement
            </p>
          </div>
        )}

        {/* Progress Overview */}
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Assessment Progress for {targetRole}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{assessedSkills}</div>
                <div className="text-sm text-gray-600">Skills Assessed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{totalSkills}</div>
                <div className="text-sm text-gray-600">Total Required</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{overallProgress}%</div>
                <div className="text-sm text-gray-600">Assessment Complete</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills by Category */}
      {skillCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              category.title.includes('Critical') ? 'bg-red-500' :
              category.title.includes('Important') ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
            <h2 className="text-xl font-semibold">{category.title}</h2>
          </div>
          <p className="text-gray-600 ml-7">{category.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-7">
            {category.skills.map((skill) => (
              <Card key={skill.id} className={`${category.color} border transition-all hover:shadow-md`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{skill.name}</CardTitle>
                      <Badge className={`mt-2 ${getImportanceBadgeColor(skill.importance)}`} variant="secondary">
                        {skill.importance.charAt(0).toUpperCase() + skill.importance.slice(1)}
                      </Badge>
                    </div>
                    {skill.isAssessed && (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{skill.roleRelevance}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Level:</span>
                      <span className="font-medium">
                        {skill.currentLevel ? `${skill.currentLevel}%` : 'Not assessed'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Required Level:</span>
                      <span className="font-medium">{skill.requiredLevel}%</span>
                    </div>
                    
                    {skill.currentLevel && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span>{Math.round((skill.currentLevel / skill.requiredLevel) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(skill.currentLevel / skill.requiredLevel) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    {skill.gapLevel > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-700">
                          {skill.gapLevel}% gap to target level
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => startAssessment(skill)}
                    className="w-full"
                    variant={skill.isAssessed ? "outline" : "default"}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {skill.isAssessed ? 'Re-assess Skill' : 'Assess Skill'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {!targetRole && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Target Role Selected</h3>
            <p className="text-gray-500 mb-4">
              Set a target role in your career goals to see relevant skill assessments.
            </p>
            <Button onClick={() => setLocation('/career-transitions')}>
              Set Target Role
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}